'use client'

import { useState } from 'react'
import { ChevronDown, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format-price'
import { OrderSummary } from '@/components/checkout/order-summary'
import type { CartLineItem } from '@/types'

/**
 * Mobile-only collapsed order summary, sticky at top of the checkout column.
 * On lg+ viewports it stays hidden (the desktop right rail shows the full
 * summary instead). Matches Shopify's one-page checkout default: order
 * summary is collapsed on mobile, expandable via the toggle bar.
 */
export function MobileOrderSummary() {
  const { cart } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const total = cart?.total ?? 0
  const currency = cart?.currency_code || 'usd'
  const itemCount = (cart?.items || []).reduce(
    (sum: number, item: CartLineItem) => sum + (item.quantity || 0),
    0,
  )

  return (
    <div className="lg:hidden bg-muted/30">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="mobile-order-summary-panel"
        className="w-full container-custom py-4 flex items-center justify-between gap-3 text-sm"
      >
        <span className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" aria-hidden />
          <span className="font-medium">
            {isOpen ? 'Hide order summary' : 'Show order summary'}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
          {itemCount > 0 && (
            <span className="text-muted-foreground">
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          )}
        </span>
        <span className="font-heading text-lg font-semibold">
          {formatPrice(total, currency)}
        </span>
      </button>

      {isOpen && (
        <div
          id="mobile-order-summary-panel"
          className="container-custom pb-6 bg-background"
        >
          <div className="pt-4">
            <OrderSummary variant="plain" />
          </div>
        </div>
      )}
    </div>
  )
}
