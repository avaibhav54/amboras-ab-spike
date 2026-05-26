'use client'

import { useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'

interface ExpressCheckoutTopProps {
  /** Active Stripe PaymentIntent client secret (from initiated session). */
  clientSecret: string
  /** Stripe Connect account id (merchant's connected account). */
  stripeAccountId: string
  /** Platform Stripe publishable key. */
  publishableKey: string
  /** Called once the wallet authorizes — parent runs cart.complete + redirect. */
  onApproved: () => Promise<void>
  /** Called on wallet decline / cancellation / other failure. */
  onError: (message: string) => void
  /** True while a network request is in flight elsewhere — disables interactive UI. */
  isBusy?: boolean
}

/**
 * Shopify-style "express checkout" row rendered at the very top of /checkout
 * (above the Contact section). Surfaces Apple Pay, Google Pay, and Stripe
 * Link as one-tap payment methods that confirm the same PaymentIntent the
 * card form below would use.
 *
 * Renders nothing visible when the buyer's device/browser has no available
 * wallet (e.g. http localhost, desktop Firefox without Link). The "— OR —"
 * divider only appears when at least one wallet is offered, so the layout
 * stays tight on unsupported contexts.
 *
 * Mount conditions (decided by parent):
 *   - Stripe is the active payment provider
 *   - Cart has shipping_methods set (so the PaymentIntent amount is final)
 *   - sessionData.client_secret is present
 */
export function ExpressCheckoutTop({
  clientSecret,
  stripeAccountId,
  publishableKey,
  onApproved,
  onError,
  isBusy,
}: ExpressCheckoutTopProps) {
  const stripePromise = useMemo(
    () => loadStripe(publishableKey, { stripeAccount: stripeAccountId }),
    [publishableKey, stripeAccountId],
  )

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            borderRadius: '2px',
            fontFamily: 'inherit',
          },
        },
      }}
    >
      <ExpressCheckoutInner
        onApproved={onApproved}
        onError={onError}
        isBusy={!!isBusy}
      />
    </Elements>
  )
}

function ExpressCheckoutInner({
  onApproved,
  onError,
  isBusy,
}: Pick<ExpressCheckoutTopProps, 'onApproved' | 'onError'> & {
  isBusy: boolean
}) {
  const stripe = useStripe()
  const elements = useElements()
  // Stays false until the Element reports at least one available wallet.
  // Used to suppress the "OR" divider when there's nothing to render above it.
  const [available, setAvailable] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    if (!stripe || !elements) return
    setIsProcessing(true)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })
      if (error) {
        onError(error.message || 'Payment failed. Please try again.')
      } else {
        await onApproved()
      }
    } catch (err: unknown) {
      onError(
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const disabled = isBusy || isProcessing

  return (
    <div className={available ? 'pb-2' : ''}>
      <ExpressCheckoutElement
        onReady={(event) =>
          setAvailable(Boolean(event.availablePaymentMethods))
        }
        onConfirm={handleConfirm}
        options={{
          paymentMethods: {
            applePay: 'auto',
            googlePay: 'auto',
            link: 'auto',
            paypal: 'never',
          },
        }}
      />
      {available && (
        <>
          <p className="sr-only" aria-live="polite">
            {disabled
              ? 'Processing express checkout payment'
              : 'Express checkout options ready'}
          </p>
          <div className="mt-5 flex items-center justify-center text-xs uppercase tracking-wide text-muted-foreground">
            <span>Or</span>
          </div>
        </>
      )}
    </div>
  )
}
