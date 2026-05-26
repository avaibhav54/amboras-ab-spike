'use client'

import { Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format-price'

interface PlaceOrderBarProps {
  onClick: () => void
  disabled: boolean
  isProcessing: boolean
  total: number | null | undefined
  currency: string
}

export function PlaceOrderBar({
  onClick,
  disabled,
  isProcessing,
  total,
  currency,
}: PlaceOrderBarProps) {
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-busy={isProcessing}
        aria-live="polite"
        style={{
          backgroundColor: 'var(--brand-primary, hsl(var(--foreground)))',
        }}
        className="w-full rounded-md py-4 text-base font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        <span>
          {isProcessing ? 'Processing…' : 'Pay now'}
          {!isProcessing && typeof total === 'number' && total > 0 && (
            <span className="ml-2 opacity-80">
              · {formatPrice(total, currency)}
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
