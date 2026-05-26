'use client'

import { Loader2 } from 'lucide-react'
import { Section } from '@/components/checkout/section'
import { formatPrice } from '@/lib/utils/format-price'
import type { ShippingOption } from '@/types'

interface ShippingMethodSectionProps {
  shippingOptions: ShippingOption[]
  loadingShipping: boolean
  selectedShipping: string
  /** Buyer picks a method. Parent runs `saveShippingMethod` in the background. */
  onSelect: (optionId: string) => void
  /** Whether the address section is done — gates whether we show options. */
  addressReady: boolean
  currency: string
  collapsed: boolean
  onEdit: () => void
  isUpdating?: boolean
}

export function ShippingMethodSection({
  shippingOptions,
  loadingShipping,
  selectedShipping,
  onSelect,
  addressReady,
  currency,
  collapsed,
  onEdit,
  isUpdating,
}: ShippingMethodSectionProps) {
  const selectedOption = shippingOptions.find((o) => o.id === selectedShipping)
  const selectedPrice = selectedOption
    ? selectedOption.amount != null
      ? selectedOption.amount
      : selectedOption.prices?.[0]?.amount
    : null

  const summary = selectedOption ? (
    <div className="flex items-baseline gap-3">
      <span className="text-foreground">{selectedOption.name}</span>
      <span className="text-muted-foreground">
        {selectedPrice === 0
          ? 'Free'
          : selectedPrice != null
            ? formatPrice(selectedPrice, currency)
            : ''}
      </span>
    </div>
  ) : null

  return (
    <Section
      title="Shipping method"
      collapsed={collapsed}
      summary={summary}
      onChange={onEdit}
    >
      {!addressReady ? (
        <div className="rounded-md bg-muted/30 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Enter your shipping address to view available shipping methods.
          </p>
        </div>
      ) : loadingShipping ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : shippingOptions.length === 0 ? (
        <div className="rounded-md bg-muted/30 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            No shipping options available for this address.
          </p>
        </div>
      ) : (
        <div className="rounded-md overflow-hidden bg-muted/30">
          {shippingOptions.map((option) => {
            const price =
              option.amount != null
                ? option.amount
                : option.prices?.[0]?.amount
            const priceLabel =
              price === 0
                ? 'Free'
                : price != null
                  ? formatPrice(price, currency)
                  : '—'

            const isSelected = selectedShipping === option.id
            return (
              <label
                key={option.id}
                className={`flex items-center justify-between gap-4 px-4 py-3.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[hsl(var(--accent)_/_0.06)]'
                    : 'hover:bg-muted/40'
                } ${isUpdating ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    value={option.id}
                    checked={isSelected}
                    onChange={() => onSelect(option.id)}
                    className="accent-[hsl(var(--accent))]"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{option.name}</p>
                    {option.type?.description && (
                      <p className="text-xs text-muted-foreground">
                        {option.type.description}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">{priceLabel}</span>
              </label>
            )
          })}
        </div>
      )}
    </Section>
  )
}
