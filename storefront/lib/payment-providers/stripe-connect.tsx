'use client'

import { Loader2 } from 'lucide-react'
import { useStripeConfig } from '@/hooks/use-stripe-config'
import { StripePaymentForm } from '@/components/checkout/stripe-payment-form'
import type { PaymentProviderConfig, PaymentProviderComponentProps } from './types'

function StripeConnectAdapter({
  sessionData,
  isCompleting,
  onApproved,
  onError,
  registerConfirm,
}: PaymentProviderComponentProps) {
  const { publishableKey } = useStripeConfig()

  const clientSecret = sessionData?.client_secret as string | undefined
  const stripeAccountId = (sessionData?.stripe_account_id as string | undefined) ?? ''

  if (!clientSecret || !publishableKey) {
    return (
      <div className="border rounded-sm p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Initializing payment…</span>
      </div>
    )
  }

  return (
    <StripePaymentForm
      clientSecret={clientSecret}
      stripeAccountId={stripeAccountId}
      publishableKey={publishableKey}
      isCompletingOrder={isCompleting}
      onPaymentSuccess={onApproved}
      onError={onError}
      registerConfirm={registerConfirm}
    />
  )
}

export const stripeConnectProvider: PaymentProviderConfig = {
  id: 'pp_stripe-connect_stripe-connect',
  label: 'Pay with card',
  kind: 'form', // Card form / Stripe Payment Element renders below express row
  // Match the whole pp_stripe-* family — Medusa's Stripe module exposes
  // variants for local payment methods (bancontact, ideal, etc.). All of
  // them go through the same Stripe Elements form.
  matches: (id) => id.startsWith('pp_stripe-') || id.startsWith('pp_stripe_'),
  Component: StripeConnectAdapter,
}
