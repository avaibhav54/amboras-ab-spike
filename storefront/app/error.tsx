'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-heading font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-8">
          We encountered an unexpected error. Please try again or return to the homepage.
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
