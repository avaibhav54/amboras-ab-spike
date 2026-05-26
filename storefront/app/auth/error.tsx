'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth error:', error)
    }
  }, [error])

  return (
    <div className="container-custom py-16">
      <div className="mx-auto max-w-md text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-heading font-semibold mb-2">Sign-in unavailable</h2>
        <p className="text-sm text-muted-foreground mb-8">
          We hit a snag while loading the sign-in form. Try again in a moment, or head back home
          and retry.
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
            <Home className="h-4 w-4" />
            Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
