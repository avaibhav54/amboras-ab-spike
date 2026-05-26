'use client'

import { Loader2 } from 'lucide-react'
import { usePayPalConfig } from '@/hooks/use-paypal-config'
import { usePaymentProviders } from '@/hooks/use-payment-providers'
import { PayPalSmartButtons } from '@/components/checkout/paypal-smart-buttons'
import type { PaymentProviderConfig, PaymentProviderComponentProps } from './types'

function PayPalAdapter({
  cart,
  sessionData,
  isCompleting,
  onApproved,
  onError,
}: PaymentProviderComponentProps) {
  const paypalConfig = usePayPalConfig()
  const { providers: availableProviders } = usePaymentProviders(
    (cart as unknown as { region_id?: string }).region_id,
  )

  const orderId = sessionData?.order_id as string | undefined
  // Read the merchant-configured intent from the session that the Medusa
  // PayPal provider populated (driven by the platform's PAYPAL_AUTO_CAPTURE
  // env). PayPal SDK MUST match server-side intent or the popup throws.
  const intentRaw = (sessionData?.intent as string | undefined) ?? 'AUTHORIZE'
  const intent: 'capture' | 'authorize' = intentRaw.toUpperCase() === 'CAPTURE' ? 'capture' : 'authorize'

  // Auto-hide PayPal's hosted card-form button when ANOTHER provider is
  // available to handle cards (e.g. Stripe). Avoids the "two card forms,
  // which one charges what?" confusion. When PayPal is the ONLY provider
  // connected, keep the card button so non-PayPal buyers can still check
  // out — otherwise the merchant would have a wallet-only checkout.
  //
  // To OVERRIDE this default for a specific store (e.g. you fork the
  // template and want PayPal's card button shown alongside Stripe), change
  // `disableFunding` below to `undefined` (show all funding sources) or to
  // your own list (e.g. 'paylater' to only hide BNPL but keep card).
  // Future: backend-controlled override via /store/paypal-connect response,
  // and per-merchant admin toggle. Both extend this same prop without
  // touching the component.
  const hasOtherProvider = availableProviders.some((p) => p.id !== paypalProvider.id)
  const disableFunding = hasOtherProvider ? 'card,credit,paylater' : undefined

  if (paypalConfig.isLoading || !paypalConfig.clientId || !paypalConfig.environment) {
    return (
      <div className="border rounded-sm p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading PayPal…</span>
      </div>
    )
  }

  return (
    <PayPalSmartButtons
      paypalOrderId={orderId ?? null}
      clientId={paypalConfig.clientId}
      environment={paypalConfig.environment}
      currency={((cart as unknown as { currency_code?: string }).currency_code) || 'usd'}
      intent={intent}
      disableFunding={disableFunding}
      disabled={isCompleting}
      onApproved={onApproved}
      onError={onError}
    />
  )
}

export const paypalProvider: PaymentProviderConfig = {
  id: 'pp_paypal_paypal',
  label: 'PayPal',
  kind: 'express', // Smart Buttons render at the top of the payment step
  // Future-proof: matches any pp_paypal_* variant Medusa might expose
  // (e.g. pp_paypal_paylater) so a new variant doesn't require a new adapter.
  matches: (id) => id.startsWith('pp_paypal_'),
  Component: PayPalAdapter,
}
