'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react'

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Checkout error:', error)
    }
  }, [error])

  return (
    <div className="container-custom py-16">
      <div className="mx-auto max-w-md text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-heading font-semibold mb-2">Checkout failed to load</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Something went wrong while preparing your order. Your cart is safe — please try again or
          head back to review your items.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-foreground/20 px-6 py-2.5 text-sm font-semibold hover:border-foreground/50 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
