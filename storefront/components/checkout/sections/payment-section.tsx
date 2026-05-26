'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Section } from '@/components/checkout/section'
import { AddressSection, type CountryOption } from '@/components/checkout/sections/address-section'
import type { Cart } from '@/types'
import type { ShippingAddress } from '@/hooks/use-checkout'
import type { PaymentProviderConfig } from '@/lib/payment-providers/types'
import type { SessionDataMap } from '@/hooks/use-checkout'

interface PaymentSectionProps {
  cart: Cart | undefined
  hasShippingMethod: boolean
  availableProviders: PaymentProviderConfig[]
  loadingProviders: boolean
  sessions: SessionDataMap
  selectedProviderId: string | null
  selectProvider: (providerId: string) => void
  isCompleting: boolean
  onApproved: () => Promise<void>
  onError: (msg: string) => void
  /** Hoists card-form submit into the outer Pay-now bar. */
  registerConfirm: (fn: (() => Promise<void>) | null) => void
  /**
   * Billing-address pipeline back to the parent. `address` is the override to
   * pass to `completeCheckout` (null = use the cart's default, i.e. the
   * shipping address). `complete` is whether the section is ready to submit
   * — false when the buyer chose "different billing" but hasn't finished
   * filling it in, true otherwise.
   */
  onBillingChange: (state: {
    complete: boolean
    address: ShippingAddress | null
  }) => void
  countryOptions: CountryOption[]
  isLoggedIn: boolean
  inputCls: (hasError: boolean) => string
}

type BillingFormValues = {
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

const EMPTY_BILLING: BillingFormValues = {
  first_name: '',
  last_name: '',
  company: '',
  address_1: '',
  address_2: '',
  city: '',
  postal_code: '',
  phone: '',
  country_code: '',
  province: '',
}

export function PaymentSection({
  cart,
  hasShippingMethod,
  availableProviders,
  loadingProviders,
  sessions,
  selectedProviderId,
  selectProvider,
  isCompleting,
  onApproved,
  onError,
  registerConfirm,
  onBillingChange,
  countryOptions,
  isLoggedIn,
  inputCls,
}: PaymentSectionProps) {
  const [billingMode, setBillingMode] = useState<'same' | 'different'>('same')

  const billingForm = useForm<BillingFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_BILLING,
  })
  const {
    register: billingRegister,
    setValue: setBillingValue,
    watch: billingWatch,
    formState: { errors: billingErrors },
  } = billingForm
  const billingValues = billingWatch()

  // Push billing → parent. 'same' is always complete (no override needed —
  // the cart already has billing_address copied from shipping by
  // saveShippingDetails). 'different' is complete once required fields pass.
  useEffect(() => {
    if (billingMode === 'same') {
      onBillingChange({ complete: true, address: null })
      return
    }
    const v = billingValues
    const requiredFilled =
      !!v.country_code &&
      !!v.last_name &&
      !!v.address_1 &&
      !!v.city &&
      !!v.postal_code
    const noErrors =
      !billingErrors.country_code &&
      !billingErrors.last_name &&
      !billingErrors.address_1 &&
      !billingErrors.city &&
      !billingErrors.postal_code
    if (!requiredFilled || !noErrors) {
      onBillingChange({ complete: false, address: null })
      return
    }
    onBillingChange({
      complete: true,
      address: {
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
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    billingMode,
    billingValues.country_code,
    billingValues.first_name,
    billingValues.last_name,
    billingValues.company,
    billingValues.address_1,
    billingValues.address_2,
    billingValues.city,
    billingValues.postal_code,
    billingValues.province,
    billingValues.phone,
  ])

  // Body content varies by readiness. We always render the Section wrapper so
  // the visual outline is consistent.
  let body: React.ReactNode
  if (!hasShippingMethod) {
    body = (
      <div className="rounded-md bg-muted/30 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Choose a shipping method to continue to payment.
        </p>
      </div>
    )
  } else if (!loadingProviders && availableProviders.length === 0) {
    body = (
      <div className="rounded-md bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">
          This is a demo store. Orders are placed using the system payment
          provider — no real payment is processed.
        </p>
      </div>
    )
  } else if (!cart) {
    body = (
      <div className="rounded-md bg-muted/30 p-5 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Initializing payment...
        </span>
      </div>
    )
  } else {
    const defaultEntry =
      availableProviders.find((p) => p.kind !== 'express') ?? availableProviders[0]
    const activeMethodId = selectedProviderId ?? defaultEntry?.id
    const activeProvider =
      availableProviders.find((p) => p.id === activeMethodId) ?? defaultEntry

    if (!activeProvider) {
      body = (
        <div className="rounded-md bg-muted/30 p-5 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Initializing payment...
          </span>
        </div>
      )
    } else {
      const Adapter = activeProvider.Component
      const isExpressActive = activeProvider.kind === 'express'

      body = (
        <div className="space-y-4">
          {availableProviders.length > 1 ? (
            <div className="rounded-md overflow-hidden bg-muted/30">
              {availableProviders.map((provider) => {
                const isActive = provider.id === activeProvider.id
                const isStripe = provider.id.startsWith('pp_stripe')
                return (
                  <div key={provider.id}>
                    <label
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[hsl(var(--accent)_/_0.06)]'
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={provider.id}
                        checked={isActive}
                        onChange={() => {
                          if (isActive) return
                          selectProvider(provider.id)
                        }}
                        disabled={isCompleting}
                        className="accent-[hsl(var(--accent))]"
                      />
                      <span className="flex-1 text-sm font-medium text-foreground">
                        {provider.label}
                      </span>
                    </label>
                    {isActive && (
                      <div className="px-4 py-4 bg-background">
                        <Adapter
                          key={provider.id}
                          cart={cart}
                          sessionData={sessions[provider.id] ?? null}
                          isCompleting={isCompleting}
                          onApproved={onApproved}
                          onError={onError}
                          registerConfirm={
                            isExpressActive ? undefined : registerConfirm
                          }
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-md overflow-hidden bg-muted/30">
              {activeProvider.id.startsWith('pp_stripe') && (
                <div className="flex items-center gap-3 px-4 py-3 bg-[hsl(var(--accent)_/_0.06)]">
                  <span className="text-sm font-medium text-foreground">
                    {activeProvider.label}
                  </span>
                </div>
              )}
              <div className="px-4 py-4 bg-background">
                <Adapter
                  key={activeProvider.id}
                  cart={cart}
                  sessionData={sessions[activeProvider.id] ?? null}
                  isCompleting={isCompleting}
                  onApproved={onApproved}
                  onError={onError}
                  registerConfirm={isExpressActive ? undefined : registerConfirm}
                />
              </div>
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <Section title="Payment">
      {body}

      {/* Billing-address toggle: shown once the payment surface is up (a real
          provider exists). Demo and pre-shipping-method states skip it. */}
      {hasShippingMethod && availableProviders.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[15px] font-semibold text-foreground mb-3">
            Billing address
          </h3>
          <div className="rounded-md overflow-hidden bg-muted/30">
            <label
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                billingMode === 'same'
                  ? 'bg-[hsl(var(--accent)_/_0.06)]'
                  : 'hover:bg-muted/40'
              }`}
            >
              <input
                type="radio"
                name="billing-mode"
                value="same"
                checked={billingMode === 'same'}
                onChange={() => setBillingMode('same')}
                className="accent-[hsl(var(--accent))]"
              />
              <span className="text-sm font-medium text-foreground">
                Same as shipping address
              </span>
            </label>
            <label
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                billingMode === 'different'
                  ? 'bg-[hsl(var(--accent)_/_0.06)]'
                  : 'hover:bg-muted/40'
              }`}
            >
              <input
                type="radio"
                name="billing-mode"
                value="different"
                checked={billingMode === 'different'}
                onChange={() => setBillingMode('different')}
                className="accent-[hsl(var(--accent))]"
              />
              <span className="text-sm font-medium text-foreground">
                Use a different billing address
              </span>
            </label>
          </div>

          {billingMode === 'different' && (
            <div className="mt-4">
              <AddressSection
                mode="billing"
                register={billingRegister}
                errors={billingErrors}
                setValue={setBillingValue}
                inputCls={inputCls}
                address={billingValues}
                countryOptions={countryOptions}
                onCountryChange={() => {
                  /* no-op: billing country doesn't drive shipping region */
                }}
                isLoggedIn={isLoggedIn}
              />
            </div>
          )}
        </div>
      )}
    </Section>
  )
}
