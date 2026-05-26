'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/use-cart'
import { Minus, Plus, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { trackAddToCart } from '@/lib/analytics'
import { openCartDrawer } from '@/lib/cart-ui'

interface ProductVariant {
  id: string;
  product_id?: string;
  inventory_quantity?: number;
  allow_backorder?: boolean;
  calculated_price?: {
    calculated_amount?: number;
    currency_code?: string;
  };
}

interface AddToCartProps {
  variant: ProductVariant;
}

export default function AddToCart({ variant }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1)
  const { addItem, isAddingItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const inventoryQuantity = variant?.inventory_quantity
  const allowBackorder = variant?.allow_backorder ?? false
  const isOutOfStock = !allowBackorder && inventoryQuantity != null && inventoryQuantity <= 0
  const isLowStock = inventoryQuantity != null && inventoryQuantity > 0 && inventoryQuantity < 10

  const handleAddToCart = () => {
    if (!variant?.id || isOutOfStock) return

    addItem(
      { variantId: variant.id, quantity },
      {
        onSuccess: () => {
          setJustAdded(true)
          openCartDrawer()
          const value = variant.calculated_price?.calculated_amount
          trackAddToCart(variant.product_id || '', variant.id, quantity, value)
          setTimeout(() => setJustAdded(false), 2000)
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to add to bag')
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      {/* Low Stock Warning */}
      {isLowStock && (
        <p className="text-sm text-accent font-medium">
          Only {inventoryQuantity} left in stock
        </p>
      )}

      {/* Quantity + Add to Cart */}
      <div className="flex gap-3">
        {/* Quantity Selector */}
        <div className="flex items-center border">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-3 hover:bg-muted transition-colors"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-sm font-medium tabular-nums">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="p-3 hover:bg-muted transition-colors"
            disabled={isOutOfStock || (!allowBackorder && inventoryQuantity != null && quantity >= inventoryQuantity)}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAddingItem}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold uppercase tracking-wide transition-all ${
            isOutOfStock
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : justAdded
              ? 'bg-green-700 text-white'
              : 'bg-foreground text-background hover:opacity-90'
          }`}
        >
          {isAddingItem ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : justAdded ? (
            <>
              <Check className="h-4 w-4" />
              Added
            </>
          ) : isOutOfStock ? (
            'Sold Out'
          ) : (
            'Add to Bag'
          )}
        </button>
      </div>
    </div>
  )
}
