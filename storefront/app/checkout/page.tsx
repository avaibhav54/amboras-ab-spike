'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useCheckout, type ShippingAddress } from '@/hooks/use-checkout'
import { useCheckoutSettings } from '@/hooks/use-checkout-settings'
import { useAuth } from '@/hooks/use-auth'
import { useStripeConfig } from '@/hooks/use-stripe-config'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { trackBeginCheckout } from '@/lib/analytics'
import { ClientPluginSlot } from '@/components/ClientPluginSlot'
import { hasNoPostalCode, getPostalCodeRule } from '@/lib/checkout/postal-codes'
import { getRegionRule } from '@/lib/checkout/region-rules'
import { OrderSummary } from '@/components/checkout/order-summary'
import { MobileOrderSummary } from '@/components/checkout/mobile-order-summary'
import { ContactSection } from '@/components/checkout/sections/contact-section'
import { AddressSection, type CountryOption } from '@/components/checkout/sections/address-section'
import { ShippingMethodSection } from '@/components/checkout/sections/shipping-method-section'
import { PaymentSection } from '@/components/checkout/sections/payment-section'
import { PlaceOrderBar } from '@/components/checkout/place-order-bar'
import { ExpressCheckoutTop } from '@/components/checkout/express-checkout-top'
import type { LineItem } from '@/types'

function toCurrencyValue(amount: number | null | undefined): number | undefined {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return undefined
  return Math.round(amount * 100) / 100
}

type InfoFormValues = {
  email: string
  first_name: string
  last_name: string
  company: string
  address_1: string
  address_2: string
  city: string
  postal_code: string
  phone: string
  country_code: string
  province: string
}
        
export default function CheckoutPage() {
  const router = useRouter()
  const {
    cart, shippingOptions, loadingShipping,
    regions, changeRegion,
    saveShippingDetails, saveShippingMethod, hasShippingMethod,
    completeCheckout,
    isUpdating, error, clearError,
    sessions, selectedProviderId, selectProvider, availableProviders, loadingProviders,
  } = useCheckout()

  const { data: checkoutSettings } = useCheckoutSettings()
  const { customer, isLoggedIn, isLoading: authLoading } = useAuth()
  const stripeConfig = useStripeConfig()

  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InfoFormValues>({
    mode: 'onTouched',
    defaultValues: {
      email: '', first_name: '', last_name: '', company: '',
      address_1: '', address_2: '', city: '', postal_code: '',
      phone: '', country_code: '', province: '',
    },
  })

  const watchedEmail = watch('email')
  const watchedAddress = watch()

  const [marketingOptIn, setMarketingOptIn] = useState(false)
  // Which shipping option radio is checked. Selection auto-saves to Medusa
  // (saveShippingMethod), which in turn unlocks the payment section once the
  // cart has shipping_methods set.
  const [selectedShipping, setSelectedShipping] = useState('')

  // Section edit state — Shopify one-page checkout auto-collapses completed
  // sections into a summary row with a "Change" link.
  const [contactEditing, setContactEditing] = useState(false)
  const [addressEditing, setAddressEditing] = useState(false)
  const [shippingEditing, setShippingEditing] = useState(false)
  // "Save this information for next time" — guests only. Wired up in a later
  // PR to actually create a customer record post-order.
  const [saveInfo, setSaveInfo] = useState(false)

  // Billing pipeline from PaymentSection: `complete` gates the Pay-now button
  // (false while the buyer is mid-typing in a "different billing" form);
  // `address` is the override passed to completeCheckout (null = use shipping).
  const [billingState, setBillingState] = useState<{
    complete: boolean
    address: ShippingAddress | null
  }>({ complete: true, address: null })
  const billingStateRef = useRef(billingState)
  useEffect(() => {
    billingStateRef.current = billingState
  }, [billingState])

  // Stripe (and any card-form provider) registers its confirmPayment fn here
  // so the outer Pay-now bar can invoke it. Wallet providers (PayPal) don't
  // register — they render their own button instead. `confirmReady` mirrors
  // the ref as state so the Pay-now bar enables/disables responsively when
  // the adapter finishes initializing.
  const confirmFnRef = useRef<(() => Promise<void>) | null>(null)
  const [confirmReady, setConfirmReady] = useState(false)
  const registerConfirm = useCallback(
    (fn: (() => Promise<void>) | null) => {
      confirmFnRef.current = fn
      setConfirmReady(!!fn)
    },
    [],
  )

  const hasItems = cart?.items && cart.items.length > 0
  const currency = cart?.currency_code || 'usd'

  // Country dropdown lives in the address form (Shopify pattern: country
  // first, then the rest of the address). We flatten every sellable country
  // across all regions so the buyer picks "country" not "region", and we
  // map back to the right region under the hood on selection.
  const countryOptions = useMemo<CountryOption[]>(() => {
    const map = new Map<string, CountryOption>()
    ;(regions || []).forEach((r: any) => {
      ;(r.countries || []).forEach((c: any) => {
        const iso = (c?.iso_2 || '').toUpperCase()
        if (!iso || map.has(iso)) return
        map.set(iso, {
          code: iso,
          name: c.display_name || c.name || iso,
          regionId: r.id,
        })
      })
    })
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [regions])

  const onCountryChange = (countryCode: string) => {
    const option = countryOptions.find((c) => c.code === countryCode)
    const currentRegionId = (cart as any)?.region_id
    if (option && option.regionId !== currentRegionId) {
      void changeRegion(option.regionId)
    }
  }

  const trackedCheckout = useRef(false)
  useEffect(() => {
    if (cart?.id && hasItems && !trackedCheckout.current) {
      trackedCheckout.current = true
      const itemCount = (cart.items || []).reduce((sum: number, item: LineItem) => sum + item.quantity, 0)
      const contentIds = (cart.items || []).map((item: LineItem) => item.variant_id).filter(Boolean)
      const contents = (cart.items || []).map((item: LineItem) => ({
        id: item.variant_id,
        quantity: item.quantity,
        item_price: toCurrencyValue(item.unit_price),
      }))

      trackBeginCheckout(cart.id, toCurrencyValue(cart.total), currency, {
        itemCount,
        contentIds,
        contents,
      })
    }
  }, [cart?.id, hasItems, cart?.total, currency, cart?.items])

  useEffect(() => {
    if (!authLoading && checkoutSettings?.require_account && !isLoggedIn) {
      toast.error('Please sign in to continue to checkout')
      router.push('/auth/login?redirect=/checkout')
    }
  }, [authLoading, checkoutSettings?.require_account, isLoggedIn, router])

  useEffect(() => {
    if (customer?.email) {
      setValue('email', customer.email, { shouldValidate: false })
    }
  }, [customer?.email, setValue])

  // Keep the form's (hidden) country_code in sync with the cart's region/country.
  // Re-syncs whenever the buyer switches region via the "Ship to" selector —
  // otherwise a stale country (e.g. us) gets submitted against the new region
  // (UK) and Medusa rejects it ("Country with code us is not within region UK").
  //
  // Medusa returns iso_2 in lowercase ("us"); our country options are stored in
  // UPPERCASE ("US") so the address dropdown can match. Uppercase the cart's
  // value here so the option's `value="US"` matches and the dropdown displays
  // the saved country instead of showing blank.
  useEffect(() => {
    const raw =
      (cart as any)?.shipping_address?.country_code || (cart as any)?.region?.countries?.[0]?.iso_2
    const countryCode = typeof raw === 'string' ? raw.toUpperCase() : raw
    if (countryCode) {
      setValue('country_code', countryCode, { shouldValidate: false })
    }
  }, [cart?.shipping_address?.country_code, cart?.region?.countries, setValue])

  useEffect(() => {
    if (checkoutSettings?.marketing_opt_in?.enabled && checkoutSettings.marketing_opt_in.pre_checked) {
      setMarketingOptIn(true)
    }
  }, [checkoutSettings?.marketing_opt_in])

  // Background auto-save: once the buyer has typed enough that the address
  // form passes validation, debounce 600ms and push to Medusa. This causes
  // /store/fulfillment/cart-options to refetch (its query key includes the
  // cart's shipping_address.country_code) so the Shipping Method radios can
  // populate without the buyer clicking "continue".
  useEffect(() => {
    if (!cart?.id) return
    const v = watchedAddress
    // Country-aware required-field check. UAE/HK/QA/etc. hide the postal field
    // entirely so requiring postal_code would lock them out of auto-save and
    // (downstream) Pay-now. Mexico requires the colonia (address_2) on top of
    // the standard fields. Countries with `regionRequired` (CN/RU/EG/JP/etc.)
    // also need province before the address counts as filled.
    const cc = v.country_code
    const postalNeeded = !!cc && !hasNoPostalCode(cc) && getPostalCodeRule(cc).requirement !== 'optional'
    const regionNeeded = !!cc && getRegionRule(cc).requirement === 'required'
    const isMexico = cc?.toUpperCase() === 'MX'
    const requiredFilled =
      !!v.email &&
      !!v.country_code &&
      !!v.last_name &&
      !!v.address_1 &&
      !!v.city &&
      (!postalNeeded || !!v.postal_code) &&
      (!regionNeeded || !!v.province) &&
      (!isMexico || !!v.address_2)
    const anyFieldErrors =
      errors.email ||
      errors.country_code ||
      errors.first_name ||
      errors.last_name ||
      errors.address_1 ||
      errors.address_2 ||
      errors.city ||
      errors.postal_code ||
      errors.province ||
      errors.phone
    if (!requiredFilled || anyFieldErrors) return

    const t = setTimeout(() => {
      void saveShippingDetails(v.email, {
        first_name: v.first_name || '',
        last_name: v.last_name,
        company: v.company || '',
        address_1: v.address_1,
        address_2: v.address_2 || '',
        city: v.city,
        postal_code: v.postal_code,
        country_code: v.country_code,
        province: v.province || '',
        phone: v.phone || '',
      })
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cart?.id,
    watchedAddress.email,
    watchedAddress.country_code,
    watchedAddress.first_name,
    watchedAddress.last_name,
    watchedAddress.company,
    watchedAddress.address_1,
    watchedAddress.address_2,
    watchedAddress.city,
    watchedAddress.postal_code,
    watchedAddress.province,
    watchedAddress.phone,
  ])

  // Auto-collapse derivations.
  //
  // Contact collapses when the buyer either is already logged in OR has typed
  // a valid email (we don't strictly require a blur — the section is short
  // enough that "valid → collapse" feels right). The buyer can re-expand via
  // the Change action.
  const emailValid =
    !!watchedEmail &&
    !errors.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail)
  const contactCollapsed = !contactEditing && (isLoggedIn || emailValid)

  // Address collapses when every required field is filled AND there are no
  // validation errors on any optional field either. We gate on the buyer
  // having actually filled things in (vs an empty initial state) so a fresh
  // load doesn't render the section as a collapsed empty row.
  //
  // Country-aware: requires postal only when the country uses one (skip UAE/HK
  // etc.), requires province only when the country's region rule is required
  // (skip Germany/France/etc.), and requires address_2 only for Mexico
  // (colonia is needed for delivery).
  const ac = watchedAddress.country_code
  const acPostalNeeded =
    !!ac && !hasNoPostalCode(ac) && getPostalCodeRule(ac).requirement !== 'optional'
  const acRegionNeeded = !!ac && getRegionRule(ac).requirement === 'required'
  const acIsMexico = ac?.toUpperCase() === 'MX'
  const addressFilled =
    !!watchedAddress.country_code &&
    !!watchedAddress.last_name &&
    !!watchedAddress.address_1 &&
    !!watchedAddress.city &&
    (!acPostalNeeded || !!watchedAddress.postal_code) &&
    (!acRegionNeeded || !!watchedAddress.province) &&
    (!acIsMexico || !!watchedAddress.address_2)
  const addressNoErrors =
    !errors.country_code &&
    !errors.first_name &&
    !errors.last_name &&
    !errors.address_1 &&
    !errors.address_2 &&
    !errors.city &&
    !errors.postal_code &&
    !errors.province &&
    !errors.phone
  const addressCollapsed = !addressEditing && addressFilled && addressNoErrors

  // Buyer picks a shipping method radio. Selection itself drives the cart
  // update — there's no "Continue" button anymore.
  const onSelectShippingMethod = (optionId: string) => {
    if (optionId === selectedShipping) return
    setSelectedShipping(optionId)
    setShippingEditing(false)
    void saveShippingMethod(optionId)
  }

  const buildSuccessUrl = (order: { id: string }) => {
    return `/checkout/success?order=${encodeURIComponent(order.id)}`
  }

  // Called by the active payment adapter once the buyer authorizes payment.
  // We reach into billingStateRef so the latest "use different billing"
  // selection is passed to completeCheckout even if it changed after the
  // callback was created.
  const handleApproved = useCallback(async () => {
    const override = billingStateRef.current.address
    const order = await completeCheckout(
      override ? { billingAddress: override } : undefined,
    )
    if (order) {
      toast.success('Order placed successfully!')
      router.push(buildSuccessUrl(order))
    }
  }, [completeCheckout, router])

  const handleAdapterError = useCallback(
    (msg: string) => {
      clearError()
      toast.error(msg)
    },
    [clearError],
  )

  // The single Pay-now bar at the bottom. Behaviour depends on the active
  // provider:
  //   - Demo (no real providers): call completeCheckout directly.
  //   - Card form (Stripe): invoke the confirm fn that the adapter registered.
  //     Stripe's onPaymentSuccess → handleApproved → completeCheckout.
  //   - Express (PayPal): never invoked — the bar is hidden, the adapter is
  //     the button.
  const handlePayNow = async () => {
    if (isUpdating) return
    clearError()

    if (availableProviders.length === 0) {
      const override = billingStateRef.current.address
      const order = await completeCheckout(
        override ? { billingAddress: override } : undefined,
      )
      if (order) {
        toast.success('Order placed successfully!')
        router.push(buildSuccessUrl(order))
      }
      return
    }

    const confirm = confirmFnRef.current
    if (confirm) {
      await confirm()
    }
  }

  const inputCls = (hasError: boolean) =>
    `w-full bg-transparent px-0 py-3 text-sm placeholder:text-muted-foreground focus:outline-none transition-colors ${
      hasError ? 'text-destructive' : 'text-foreground'
    }`

  // Which payment provider is currently active (radio selection or default).
  // Drives Pay-now bar visibility: when the active provider is a wallet
  // (kind === 'express'), the adapter renders its own button and the bar
  // hides.
  const activeProvider = useMemo(() => {
    if (availableProviders.length === 0) return null
    const defaultEntry =
      availableProviders.find((p) => p.kind !== 'express') ?? availableProviders[0]
    return (
      availableProviders.find((p) => p.id === (selectedProviderId ?? defaultEntry?.id)) ??
      defaultEntry
    )
  }, [availableProviders, selectedProviderId])

  // ExpressCheckoutTop renders only when a Stripe PaymentIntent is live for
  // the active session (we share the same clientSecret with the card form
  // below). Pre-shipping-method, sessionData is null and the express row
  // doesn't render — buyer would have the wrong amount on the wallet sheet
  // because shipping isn't priced yet.
  const stripeSessionData = useMemo(() => {
    if (!activeProvider) return null
    if (activeProvider.kind === 'express') return null
    if (!activeProvider.id.startsWith('pp_stripe')) return null
    return sessions[activeProvider.id] ?? null
  }, [activeProvider, sessions])
  const stripeClientSecret = stripeSessionData?.client_secret as
    | string
    | undefined
  const stripeAccountIdFromSession = stripeSessionData?.stripe_account_id as
    | string
    | undefined
  const showExpressTop =
    !!stripeClientSecret &&
    !!stripeConfig.publishableKey &&
    hasShippingMethod

  // The "express row at the top" replacement — for now PR 3 has not landed the
  // top express buttons yet (PR 4), so an express selection in the radios
  // just renders the PayPal Smart Buttons in place of the Pay-now bar.
  const payBarVisible = activeProvider?.kind !== 'express'

  // Stripe session must be initialised (sessionData with client_secret) before
  // the outer Pay-now bar can confirm. We can't directly check client_secret
  // from here, but checking `sessions[activeProvider.id]` being set is a
  // close proxy — the adapter shows a Loader2 until it has the data.
  const sessionReady =
    !!activeProvider && !!sessions[activeProvider.id]
  const cartTotal = (cart as any)?.total ?? 0

  const isPayReady =
    !isUpdating &&
    !!hasItems &&
    addressFilled &&
    addressNoErrors &&
    !!selectedShipping &&
    hasShippingMethod &&
    billingState.complete &&
    (availableProviders.length === 0 || sessionReady) &&
    (availableProviders.length === 0 || confirmReady || activeProvider?.kind === 'express')

  return (
    <>
      {/* checkoutStart slot — invisible, fires InitiateCheckout trackers */}
      <ClientPluginSlot
        name="checkoutStart"
        context={{ cartId: cart?.id, itemCount: cart?.items?.length, total: cart?.total }}
      />

      {/* Mobile: collapsed order summary at top (Shopify pattern) */}
      <MobileOrderSummary />

      {/* Shopify half-and-half desktop layout: form left (white), summary
          right (tinted, edge-to-edge). Stacked on mobile. */}
      <div className="lg:grid lg:grid-cols-2">
        {/* ============ LEFT COLUMN: form ============ */}
        <div className="px-6 py-8 sm:px-10 lg:py-12 lg:pl-14 lg:pr-12 lg:flex lg:justify-end">
          <div className="w-full lg:max-w-[520px]">
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="flex items-start gap-3 p-4 mb-6 border border-destructive/30 rounded-sm bg-destructive/5"
              >
                <AlertCircle
                  className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5"
                  aria-hidden
                />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* One-page Shopify-style stack: Express row → Contact →
                Delivery → Shipping method → Payment → Pay-now bar. Each
                section auto-collapses to a summary once it validates; the
                Pay-now bar drives the active payment provider's confirm flow. */}
            <div className="space-y-2">
              {showExpressTop && stripeClientSecret && stripeConfig.publishableKey && (
                <ExpressCheckoutTop
                  clientSecret={stripeClientSecret}
                  stripeAccountId={stripeAccountIdFromSession ?? ''}
                  publishableKey={stripeConfig.publishableKey}
                  onApproved={handleApproved}
                  onError={handleAdapterError}
                  isBusy={isUpdating}
                />
              )}

              <ContactSection
                register={register}
                errors={errors}
                inputCls={inputCls}
                collapsed={contactCollapsed}
                onEdit={() => setContactEditing(true)}
                emailValue={watchedEmail}
                isLoggedIn={isLoggedIn}
                checkoutSettings={checkoutSettings}
                marketingOptIn={marketingOptIn}
                setMarketingOptIn={setMarketingOptIn}
              />

              <AddressSection
                register={register}
                errors={errors}
                setValue={setValue}
                inputCls={inputCls}
                collapsed={addressCollapsed}
                onEdit={() => setAddressEditing(true)}
                address={{
                  first_name: watchedAddress.first_name || '',
                  last_name: watchedAddress.last_name || '',
                  company: watchedAddress.company || '',
                  address_1: watchedAddress.address_1 || '',
                  address_2: watchedAddress.address_2 || '',
                  city: watchedAddress.city || '',
                  postal_code: watchedAddress.postal_code || '',
                  province: watchedAddress.province || '',
                  country_code: watchedAddress.country_code || '',
                  phone: watchedAddress.phone || '',
                }}
                countryOptions={countryOptions}
                onCountryChange={onCountryChange}
                checkoutSettings={checkoutSettings}
                saveInfo={saveInfo}
                setSaveInfo={setSaveInfo}
                isLoggedIn={isLoggedIn}
                isUpdating={isUpdating}
              />

              <ShippingMethodSection
                shippingOptions={shippingOptions}
                loadingShipping={loadingShipping}
                selectedShipping={selectedShipping}
                onSelect={onSelectShippingMethod}
                addressReady={addressFilled && addressNoErrors}
                currency={currency}
                collapsed={!shippingEditing && !!selectedShipping && hasShippingMethod}
                onEdit={() => setShippingEditing(true)}
                isUpdating={isUpdating}
              />

              <PaymentSection
                cart={cart as any}
                hasShippingMethod={hasShippingMethod}
                availableProviders={availableProviders}
                loadingProviders={loadingProviders}
                sessions={sessions}
                selectedProviderId={selectedProviderId}
                selectProvider={selectProvider}
                isCompleting={isUpdating}
                onApproved={handleApproved}
                onError={handleAdapterError}
                registerConfirm={registerConfirm}
                onBillingChange={setBillingState}
                countryOptions={countryOptions}
                isLoggedIn={isLoggedIn}
                inputCls={inputCls}
              />

              {payBarVisible && (
                <PlaceOrderBar
                  onClick={handlePayNow}
                  disabled={!isPayReady}
                  isProcessing={isUpdating}
                  total={cartTotal}
                  currency={currency}
                />
              )}
            </div>
          </div>
        </div>

        {/* ============ RIGHT COLUMN: Desktop Order Summary (tinted, edge-to-edge) ============ */}
        <div className="hidden lg:block lg:bg-muted/40 lg:py-12 lg:pl-12 lg:pr-14">
          <div className="sticky top-8 lg:max-w-[440px]">
            <OrderSummary />
          </div>
        </div>
      </div>
    </>
  )
}
