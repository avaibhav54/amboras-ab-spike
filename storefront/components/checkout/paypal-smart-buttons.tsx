'use client'

import { useMemo } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Loader2 } from 'lucide-react'

interface PayPalSmartButtonsProps {
  /** PayPal Order ID returned by Medusa's initiatePaymentSession with provider_id=pp_paypal_paypal */
  paypalOrderId: string | null
  /** Per-tenant PayPal client_id from /store/paypal-connect */
  clientId: string
  /** 'sandbox' or 'live' */
  environment: 'sandbox' | 'live'
  /** ISO 4217, lowercase or uppercase — PayPal SDK accepts both */
  currency: string
  /**
   * Intent for the PayPal SDK script. MUST match the server-side intent that
   * Medusa's PayPal provider used when creating the order (driven by the
   * platform's PAYPAL_AUTO_CAPTURE config). PayPal will reject the popup if
   * client and server disagree.
   */
  intent: 'capture' | 'authorize'
  /**
   * Comma-separated PayPal funding sources to suppress, e.g.
   * 'card,credit,paylater' to hide everything except the yellow PayPal
   * button. Leave undefined to show all eligible funding sources.
   * Caller decides — see PayPalAdapter for the auto-hide rule.
   */
  disableFunding?: string
  /** Disable while parent is mid-request (avoids double-completion on rapid clicks) */
  disabled?: boolean
  /** Fires after buyer approves on PayPal — parent calls cart.complete() server-side */
  onApproved: () => Promise<void>
  /** Fires on SDK error or buyer cancel/popup-close */
  onError: (msg: string) => void
}

/**
 * PayPal Smart Buttons wrapper.
 *
 * The buttons themselves render the branded PayPal/PayLater UI; we only
 * provide the order_id that Medusa already created via initiatePaymentSession.
 * On buyer approval the SDK fires onApprove with the same orderID — we then
 * delegate to the parent's onApproved callback which calls cart.complete()
 * server-side. Capture happens server-side in our multi-tenant provider's
 * authorizePayment (autoCapture=true) so by the time cart.complete returns
 * an order, the money is already moved.
 *
 * Why server-side capture instead of `actions.order.capture()`:
 *   - Medusa's order workflow needs to be the chokepoint that knows about
 *     the captured payment (so order.payment_status etc. is correct)
 *   - Stripe in this template works the same way (PaymentElement confirms
 *     client-side, but cart.complete() is what creates the order)
 *   - One code path for refunds, webhooks, dispute handling
 */
export function PayPalSmartButtons({
  paypalOrderId,
  clientId,
  environment,
  currency,
  intent,
  disableFunding,
  disabled,
  onApproved,
  onError,
}: PayPalSmartButtonsProps) {
  // Minimal script options per Medusa's official PayPal storefront guide.
  // Do NOT add `data-namespace` — it relocates the SDK to
  // `window.paypal_<ns>` and `<PayPalButtons>` only looks at `window.paypal`,
  // causing "window.paypal.Buttons is undefined" at render. Sandbox vs live
  // is auto-detected by PayPal from the clientId itself (PayPal apps are
  // environment-namespaced).
  // The `environment` prop is currently unused at the SDK layer for the
  // reason above, but we keep accepting it so the adapter+UI know which
  // PayPal env the merchant is on (e.g. for help text / debug labels).
  void environment
  const scriptOptions = useMemo(
    () => ({
      clientId,
      currency: currency.toUpperCase(),
      intent,
      // Spread instead of always-set so undefined doesn't appear in the
      // script tag URL (PayPal SDK treats absent vs empty differently).
      ...(disableFunding ? { 'disable-funding': disableFunding } : {}),
    }),
    [clientId, currency, intent, disableFunding],
  )

  if (!paypalOrderId) {
    return (
      <div className="border rounded-sm p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Initializing PayPal…</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PayPalScriptProvider options={scriptOptions}>
        <PayPalButtons
          // Disable interaction while a request is in flight so a fast
          // double-click doesn't try to complete twice.
          disabled={disabled}
          // We already created the PayPal order server-side via Medusa's
          // initiatePaymentSession. Smart Buttons just needs the existing id.
          createOrder={async () => paypalOrderId}
          // Buyer approved on PayPal. Tell our server to complete the cart;
          // capture happens inside Medusa's order workflow via our provider.
          onApprove={async () => {
            try {
              await onApproved()
            } catch (err: any) {
              onError(err?.message || 'Failed to complete order')
            }
          }}
          // Includes user cancellation (closing the popup) — surface as a
          // soft message rather than an error toast.
          onCancel={() => onError('PayPal payment was cancelled.')}
          onError={(err) => {
            // Surface ALL details we can extract — PayPal SDK errors are
            // often objects with `.message` AND `.details` AND nested fields
            // depending on the failure (auth vs popup vs API). Logging the
            // whole thing so we can diagnose from console.
            // eslint-disable-next-line no-console
            console.error('[PayPal SDK error]', err)
            const message =
              (err as any)?.message ||
              (err as any)?.details?.[0]?.description ||
              (typeof err === 'string' ? err : null) ||
              'PayPal encountered an error (see browser console for details)'
            onError(message)
          }}
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            tagline: false,
          }}
        />
      </PayPalScriptProvider>
    </div>
  )
}
