'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMedusaClient } from '@/lib/medusa-client'
import { logger } from '@/lib/logger'
import { useCart } from './use-cart'
import { usePaymentProviders } from './use-payment-providers'

export interface ShippingAddress {
  first_name: string
  last_name: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  postal_code: string
  country_code: string
  province?: string
  phone?: string
}

const SYSTEM_DEFAULT_PROVIDER_ID = 'pp_system_default'

/**
 * Map of providerId → raw `data` blob from initiated payment session.
 * Each provider adapter destructures its own provider-specific fields.
 */
export type SessionDataMap = Record<string, Record<string, unknown> | null>

export function useCheckout() {
  const { cart } = useCart()
  const queryClient = useQueryClient()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Medusa allows ONE payment session per collection — initiating a session
  // deletes any existing one (createPaymentSessionsWorkflow: "we don't support
  // split payments"). So we keep a single active provider session at a time,
  // not one per provider. `sessions` therefore holds at most one entry, keyed
  // by the selected provider's id, so the adapter lookups still work.
  const [sessions, setSessions] = useState<SessionDataMap>({})
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  // Track (cart.id + cart.total + provider) so we re-initialize the payment
  // session when a discount/shipping change alters the amount mid-checkout, or
  // when the buyer switches provider — otherwise Stripe's PaymentIntent has a
  // stale amount and confirmPayment throws "elements should have a mounted
  // Payment Element".
  const initializedFor = useRef<string | null>(null)
  const [isCompletingCheckout, setIsCompletingCheckout] = useState(false)

  // Source of truth for which providers the buyer sees (via Medusa's
  // /store/payment-providers — only providers actually linked to the cart's
  // region by the merchant connecting in admin).
  const cartRegionId = (cart as any)?.region_id as string | undefined
  const { providers: availableProviders, isLoading: loadingProviders } =
    usePaymentProviders(cartRegionId)

  // Fetch shipping options — re-keyed on region + country so the list refreshes
  // when the buyer switches their shipping country (multi-region selling).
  const { data: shippingOptions, isLoading: loadingShipping } = useQuery({
    queryKey: [
      'shipping-options',
      cart?.id,
      (cart as any)?.region_id,
      (cart as any)?.shipping_address?.country_code,
    ],
    queryFn: async () => {
      if (!cart?.id) return []
      const { shipping_options } = await getMedusaClient().store.fulfillment.listCartOptions({
        cart_id: cart.id,
      })
      return shipping_options || []
    },
    enabled: !!cart?.id,
  })

  // Available regions/countries the store sells to (same-currency multi-region).
  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { regions } = await getMedusaClient().store.region.list()
      return regions || []
    },
  })

  // Switch the cart to a different region/country: re-prices the cart and makes
  // that country's shipping options resolve. Sets the country on the shipping
  // address so listCartOptions returns the matching service-zone options.
  const changeRegion = async (regionId: string) => {
    if (!cart?.id) return
    const region = (regions || []).find((r: any) => r.id === regionId)
    const countryCode = region?.countries?.[0]?.iso_2
    setIsUpdating(true)
    setError(null)
    try {
      const existing = (cart as any)?.shipping_address || {}
      const { cart: updated } = await getMedusaClient().store.cart.update(cart.id, {
        region_id: regionId,
        ...(countryCode
          ? { shipping_address: { ...existing, country_code: countryCode } }
          : {}),
      })
      queryClient.setQueryData(['cart'], updated)
    } catch (err: any) {
      setError(err?.message || 'Failed to change shipping country')
    } finally {
      setIsUpdating(false)
    }
  }

  /**
   * Background auto-save for the contact + shipping address. Called by the
   * one-page checkout once the address form validates. No `addShippingMethod`
   * here — that fires when the buyer picks a method. Silently swallows errors
   * so a transient network blip doesn't toast the buyer; the final submit
   * (completeCheckout / addShippingMethod) will surface anything that matters.
   */
  const saveShippingDetails = async (email: string, address: ShippingAddress) => {
    if (!cart?.id) return
    // Medusa stores country codes as lowercase iso_2 and rejects uppercase
    // ("US"). The checkout form holds them uppercase so the dropdown options
    // (value="US") match — normalize here at the API boundary.
    const normalized: ShippingAddress = {
      ...address,
      country_code: address.country_code?.toLowerCase() || address.country_code,
    }
    try {
      const { cart: updated } = await getMedusaClient().store.cart.update(cart.id, {
        email,
        shipping_address: normalized,
        billing_address: normalized,
      })
      queryClient.setQueryData(['cart'], updated)
    } catch (err: any) {
      logger.debug('saveShippingDetails (background) failed', err)
    }
  }

  /**
   * Background add-shipping-method called the moment the buyer picks a
   * shipping option radio. The one-page checkout has no "continue" button —
   * adding the method also unlocks the payment session (see the auto-init
   * effect below, which fires once cart.shipping_methods has entries).
   */
  const saveShippingMethod = async (shippingOptionId: string) => {
    if (!cart?.id) return
    setIsUpdating(true)
    setError(null)
    try {
      const { cart: updated } = await getMedusaClient().store.cart.addShippingMethod(
        cart.id,
        { option_id: shippingOptionId },
      )
      queryClient.setQueryData(['cart'], updated)
    } catch (err: any) {
      setError(err?.message || 'Failed to set shipping method')
    } finally {
      setIsUpdating(false)
    }
  }

  const cartTotal = (cart as any)?.total as number | undefined
  const hasShippingMethod = !!(cart as any)?.shipping_methods?.length

  /**
   * Initialize the payment session for ONE provider and make it the active
   * one. A single, non-concurrent call is safe: the /store/payment-collections
   * route returns the cart's existing collection if one exists and only
   * creates (and races) when called concurrently — which we never do here.
   * Initiating the session deletes any other provider's session on the
   * collection, so `sessions` is reset to just this provider's entry.
   */
  const initSession = async (providerId: string): Promise<void> => {
    if (!cart?.id) return
    setIsUpdating(true)
    setError(null)
    try {
      const response = await getMedusaClient().store.payment.initiatePaymentSession(cart, {
        provider_id: providerId,
      })
      const pc = (response as any)?.payment_collection
      // Cache the collection back onto the cart so the next initiate reuses it
      // (the SDK skips the create call when cart.payment_collection.id is set).
      if (pc) {
        queryClient.setQueryData(['cart'], (old: any) =>
          old ? { ...old, payment_collection: pc } : old,
        )
      }
      const allSessions = (pc?.payment_sessions ?? []) as Array<{
        provider_id: string
        status: string
        data?: Record<string, unknown>
      }>
      // The pending session is the active one (initiating cancels the prior).
      const session =
        allSessions.find((s) => s.provider_id === providerId && s.status === 'pending') ||
        allSessions.find((s) => s.provider_id === providerId)
      setSessions({ [providerId]: session?.data ?? null })
    } catch (err: any) {
      logger.debug(`initiatePaymentSession failed for ${providerId}`, err)
      setError(err?.message || 'Failed to initialize payment')
      setSessions({ [providerId]: null })
    } finally {
      setIsUpdating(false)
    }
  }

  // Buyer picks a payment method (card form, PayPal, wallet…). Switching
  // re-initializes the session for that provider, which is exactly what
  // Medusa's one-session-per-collection model needs.
  const selectProvider = (providerId: string) => {
    if (!cart?.id) return
    setSelectedProviderId(providerId)
    initializedFor.current = `${cart.id}:${cartTotal}:${providerId}`
    void initSession(providerId)
  }

  // Auto-init the payment session once the cart has a shipping method —
  // this is the one-page equivalent of "moving to the payment step". Re-runs
  // when the cart total changes (discount / shipping change) for the
  // selected provider only; never concurrently.
  useEffect(() => {
    if (!hasShippingMethod || !cart?.id || loadingProviders) return
    if (availableProviders.length === 0) return
    // Skip when the cart total is zero (full discount) — no PaymentIntent; the
    // UI shows a "No payment required" panel instead.
    if (!cartTotal || cartTotal <= 0) return

    // Prefer a non-express (card form) provider as the default selection.
    const defaultProvider =
      availableProviders.find((p) => p.kind !== 'express') ?? availableProviders[0]
    const target = selectedProviderId ?? defaultProvider.id

    const key = `${cart.id}:${cartTotal}:${target}`
    if (initializedFor.current === key) return
    initializedFor.current = key
    if (!selectedProviderId) setSelectedProviderId(target)
    void initSession(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShippingMethod, cart?.id, cartTotal, loadingProviders, availableProviders.length, selectedProviderId])

  /**
   * Place the order. If `billingAddress` is provided, the cart's billing
   * address is updated first (the one-page checkout calls this when the
   * buyer has toggled "use different billing"). Without it, the cart's
   * existing billing address — auto-copied from shipping by saveShippingDetails
   * — is used.
   */
  const completeCheckout = async (opts?: { billingAddress?: ShippingAddress }) => {
    if (!cart?.id) return null

    // Prevent duplicate requests
    if (isCompletingCheckout) {
      logger.debug('Checkout already in progress, skipping duplicate request')
      return null
    }

    setIsCompletingCheckout(true)
    setIsUpdating(true)
    setError(null)

    try {
      // Update billing address if the buyer chose "use different billing" —
      // happens BEFORE complete so the order's billing address is correct.
      if (opts?.billingAddress) {
        const billing: ShippingAddress = {
          ...opts.billingAddress,
          country_code:
            opts.billingAddress.country_code?.toLowerCase() ||
            opts.billingAddress.country_code,
        }
        const { cart: updated } = await getMedusaClient().store.cart.update(cart.id, {
          billing_address: billing,
        })
        queryClient.setQueryData(['cart'], updated)
      }

      // Demo fallback path — initialize the system_default session if no
      // real provider is configured for this region. Real providers (Stripe,
      // PayPal) already initialized their session when the buyer selected them.
      if (availableProviders.length === 0) {
        await getMedusaClient().store.payment.initiatePaymentSession(cart, {
          provider_id: SYSTEM_DEFAULT_PROVIDER_ID,
        })
      }

      const result = await getMedusaClient().store.cart.complete(cart.id)

      if (result?.type === 'order') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('medusa_cart_id')
        }
        queryClient.invalidateQueries({ queryKey: ['cart'] })
        return result.order
      } else {
        setError('Payment is still pending. Please try again.')
        return null
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to place order'

      // Handle idempotency conflict OR already completed cart - order was already created
      if (errorMessage.includes('conflicted with another request') ||
          errorMessage.includes('Idempotency') ||
          errorMessage.includes('already completed')) {
        logger.debug('Cart already completed detected - order was created previously')

        // Try to fetch the completed cart/order
        try {
          const cartData = await getMedusaClient().store.cart.retrieve(cart.id)
          if (cartData?.cart?.completed_at) {
            // Cart was completed, clear it and treat as success
            if (typeof window !== 'undefined') {
              localStorage.removeItem('medusa_cart_id')
            }
            queryClient.invalidateQueries({ queryKey: ['cart'] })

            // Return a minimal order object with the cart ID so redirect happens
            return { id: cart.id } as any
          }
        } catch (retrieveErr) {
          console.error('Failed to retrieve cart:', retrieveErr)
          // If we can't retrieve it, just clear localStorage and show error
          if (typeof window !== 'undefined') {
            localStorage.removeItem('medusa_cart_id')
          }
          queryClient.invalidateQueries({ queryKey: ['cart'] })
        }
      }

      setError(errorMessage)
      return null
    } finally {
      setIsUpdating(false)
      setIsCompletingCheckout(false)
    }
  }

  return {
    cart,
    shippingOptions: shippingOptions || [],
    loadingShipping,
    regions: regions || [],
    changeRegion,
    saveShippingDetails,
    saveShippingMethod,
    hasShippingMethod,
    completeCheckout,
    isUpdating,
    error,
    clearError: () => setError(null),
    sessions,
    selectedProviderId,
    selectProvider,
    availableProviders,
    loadingProviders,
  }
}
