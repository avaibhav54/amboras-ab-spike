'use client'

import { useEffect, useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Loader2 } from 'lucide-react'

interface StripePaymentFormProps {
  clientSecret: string
  stripeAccountId: string
  publishableKey: string
  onPaymentSuccess: () => void
  onError: (message: string) => void
  isCompletingOrder?: boolean
  /**
   * Single-page checkout hook. When provided, the form hides its internal
   * "Place Order" button and registers `runConfirm` with the outer
   * `<PlaceOrderBar>` instead. Pass `undefined` to keep the legacy
   * internal-button layout (used in any non-checkout-page caller).
   */
  registerConfirm?: (fn: (() => Promise<void>) | null) => void
}

function CheckoutForm({
  onPaymentSuccess,
  onError,
  isCompletingOrder,
  registerConfirm,
}: Pick<
  StripePaymentFormProps,
  'onPaymentSuccess' | 'onError' | 'isCompletingOrder' | 'registerConfirm'
>) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  // The one-page checkout renders the Express Checkout (Apple Pay / Google
  // Pay / Link) row at the TOP of the page (above the Contact section) via
  // <ExpressCheckoutTop>. That widget confirms the same PaymentIntent we do
  // here, so this form just renders the card field and (when not hoisted)
  // the Place Order button.
  const runConfirm = async () => {
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
        onPaymentSuccess()
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Register runConfirm with the outer PlaceOrderBar so its "Pay now" button
  // confirms this PaymentIntent. The bar polls this fn via ref so a re-render
  // of runConfirm doesn't matter — but we still want it to clear on unmount.
  useEffect(() => {
    if (!registerConfirm) return
    if (!stripe || !elements) return
    registerConfirm(runConfirm)
    return () => registerConfirm(null)
    // runConfirm closes over stripe + elements; we re-register when those
    // arrive (initially null on mount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, elements, registerConfirm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await runConfirm()
  }

  const busy = isProcessing || isCompletingOrder
  const hoistedSubmit = !!registerConfirm

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {/* When the outer PlaceOrderBar is driving submit, suppress our own
          button. Legacy callers (no registerConfirm) still get the inline
          Place Order button. */}
      {!hoistedSubmit && (
        <button
          type="submit"
          disabled={!stripe || !elements || busy}
          className="w-full bg-foreground text-background py-3.5 text-sm font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isCompletingOrder
            ? 'Completing Order...'
            : isProcessing
              ? 'Processing...'
              : 'Place Order'}
        </button>
      )}
    </form>
  )
}

export function StripePaymentForm({
  clientSecret,
  stripeAccountId,
  publishableKey,
  onPaymentSuccess,
  onError,
  isCompletingOrder,
  registerConfirm,
}: StripePaymentFormProps) {
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
      <CheckoutForm
        onPaymentSuccess={onPaymentSuccess}
        onError={onError}
        isCompletingOrder={isCompletingOrder}
        registerConfirm={registerConfirm}
      />
    </Elements>
  )
}
