'use client'

import Link from 'next/link'
import Image from 'next/image'
import { HelpCircle, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { PromoCodeInput } from '@/components/checkout/promo-code-input'
import { ClientPluginSlot } from '@/components/ClientPluginSlot'
import { getProductImage } from '@/lib/utils/placeholder-images'
import { formatPrice } from '@/lib/utils/format-price'
import type { CartLineItem } from '@/types'

interface OrderSummaryProps {
  /** 'card' draws an outer bordered/tinted panel (mobile expand). 'plain' for the desktop rail. */
  variant?: 'card' | 'plain'
}

export function OrderSummary({ variant = 'plain' }: OrderSummaryProps) {
  const {
    cart,
    appliedPromoCodes,
    discountTotal,
    applyPromoCode,
    removePromoCode,
    isApplyingPromo,
    isRemovingPromo,
  } = useCart()

  const hasItems = !!cart?.items && cart.items.length > 0
  const currency = cart?.currency_code || 'usd'
  const currencyUpper = currency.toUpperCase()

  const wrapperCls =
    variant === 'card'
      ? 'rounded p-4 bg-muted/30'
      : ''

  if (!hasItems) {
    return (
      <div className={wrapperCls}>
        <div className="text-center py-8">
          <ShoppingBag
            className="mx-auto h-8 w-8 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <p className="mt-3 text-sm text-muted-foreground">Your bag is empty</p>
          <Link
            href="/products"
            className="mt-3 inline-block text-sm font-medium text-[hsl(var(--accent))] hover:underline underline-offset-4"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const isTaxInclusive = cart?.items?.some(
    (item: CartLineItem) => item.is_tax_inclusive,
  )
  const checkoutSubtotal = isTaxInclusive
    ? cart?.original_item_total ?? 0
    : cart?.original_item_subtotal ?? cart?.subtotal ?? 0

  const hasShippingMethod = (cart?.shipping_methods?.length ?? 0) > 0
  const shippingLabel = hasShippingMethod
    ? cart?.shipping_total != null && cart.shipping_total > 0
      ? formatPrice(cart.shipping_total, currency)
      : 'Free'
    : null

  return (
    <div className={wrapperCls}>
      {/* Line items */}
      <ul className="space-y-4">
        {cart?.items?.map((item: CartLineItem) => (
          <li key={item.id} className="flex gap-3 items-center">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden bg-muted rounded">
              <Image
                src={getProductImage(item.thumbnail, item.product_id || item.id)}
                alt={item.title}
                fill
                className="object-cover"
              />
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-muted-foreground text-[10px] font-medium text-background ring-2 ring-background">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {item.title}
              </p>
              {item.variant?.title && item.variant.title !== 'Default' && (
                <p className="text-xs text-muted-foreground truncate">
                  {item.variant.title}
                </p>
              )}
            </div>
            <p className="text-sm font-medium text-foreground whitespace-nowrap">
              {formatPrice(item.unit_price, currency)}
            </p>
          </li>
        ))}
      </ul>

      {/* Promo code — boxed input + Apply, always visible */}
      <div className="mt-6">
        <PromoCodeInput
          appliedPromoCodes={appliedPromoCodes}
          discountTotal={discountTotal}
          currencyCode={currency}
          isApplyingPromo={isApplyingPromo}
          isRemovingPromo={isRemovingPromo}
          onApply={applyPromoCode}
          onRemove={removePromoCode}
          defaultOpen
        />
      </div>

      {/* Totals */}
      <div className="space-y-2.5 text-sm pt-5 mt-6">
        <div className="flex justify-between">
          <span className="text-foreground">Subtotal</span>
          <span className="text-foreground">
            {formatPrice(checkoutSubtotal, currency)}
          </span>
        </div>
        {discountTotal > 0 && (
          <div className="flex justify-between text-emerald-700 dark:text-emerald-500">
            <span>Discount</span>
            <span>-{formatPrice(discountTotal, currency)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex items-center gap-1 text-foreground">
            Shipping
            <span
              title="Shipping rates are calculated based on your address and the items in your cart."
              className="text-muted-foreground hover:text-foreground transition-colors cursor-help"
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden />
            </span>
          </span>
          <span className={shippingLabel ? 'text-foreground' : 'text-muted-foreground'}>
            {shippingLabel ?? 'Enter shipping address'}
          </span>
        </div>
        {cart?.tax_total != null && cart.tax_total > 0 && (
          <div className="flex justify-between text-foreground">
            <span>{isTaxInclusive ? 'Includes tax' : 'Tax'}</span>
            <span>
              {isTaxInclusive ? '' : '+'}
              {formatPrice(cart.tax_total, currency)}
            </span>
          </div>
        )}

        {/* Total — bigger, with currency code prefix (Shopify style) */}
        <div className="flex justify-between items-baseline pt-3 mt-2">
          <span className="text-base font-semibold text-foreground">Total</span>
          <span className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground uppercase">
              {currencyUpper}
            </span>
            <span className="text-2xl font-semibold text-foreground tracking-tight">
              {formatPrice(cart?.total || 0, currency)}
            </span>
          </span>
        </div>
      </div>

      {/* checkoutOrderSummary slot — loyalty redemption, upsells */}
      <ClientPluginSlot
        name="checkoutOrderSummary"
        context={{ cartId: cart?.id, total: cart?.total }}
      />
    </div>
  )
}
