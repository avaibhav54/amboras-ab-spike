'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMedusaClient } from '@/lib/medusa-client'
import { logger } from '@/lib/logger'
import type { Promotion } from '@/types'

const CART_ID_KEY = 'medusa_cart_id'

function getCartId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CART_ID_KEY)
}

function setCartId(id: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_ID_KEY, id)
}

function clearCartId() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_ID_KEY)
}

export function useCart() {
  const queryClient = useQueryClient()

  const { data: cart, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const cartId = getCartId()

      if (cartId) {
        try {
          const response = await getMedusaClient().store.cart.retrieve(cartId)
          const retrievedCart = response.cart

          // Check if cart is already completed (has been turned into an order)
          if (retrievedCart?.completed_at) {
            logger.debug('Cart already completed, clearing and creating new cart')
            clearCartId()
            // Fall through to create new cart
          } else {
            return retrievedCart
          }
        } catch (error) {
          logger.debug('Cart not found, creating new one')
          clearCartId()
        }
      }

      // Get region to create cart with
      const regionsResponse = await getMedusaClient().store.region.list()
      const regionId = regionsResponse.regions[0]?.id

      if (!regionId) {
        throw new Error('No region found')
      }

      try {
        // Try creating cart with region_id
        const response = await getMedusaClient().store.cart.create({
          region_id: regionId,
        })
        const newCart = response.cart
        setCartId(newCart.id)
        return newCart
      } catch (error: any) {
        // If error mentions sales channel, provide helpful message
        if (error?.message?.includes('sales channel')) {
          console.error('Cart creation failed: Multiple sales channels associated with API key')
          console.error('Please configure NEXT_PUBLIC_SALES_CHANNEL_ID in .env.local')
          throw new Error('Cart creation requires sales channel configuration. See console for details.')
        }
        throw error
      }
    },
    staleTime: 60000, // Cache cart data for 60 seconds
  })

  // CORRECT: Use createLineItem (not addLineItem)
  const addItem = useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      if (!cart) throw new Error('No cart available')

      try {
        const response = await getMedusaClient().store.cart.createLineItem(cart.id, {
          variant_id: variantId,
          quantity,
        })
        return response.cart
      } catch (err: any) {
        // Medusa returns "Some variant of variant ${id} does not have the required
        // inventory" when the variant is short of stock. Translate to a friendlier
        // shopper-facing message — the raw backend wording is jargon-y.
        const msg: string = err?.message || ''
        if (/inventory/i.test(msg) && /variant/i.test(msg)) {
          throw new Error("Sorry, this item is out of stock or doesn't have enough inventory.")
        }
        throw err
      }
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart)
    },
    onError: (error) => {
      console.error('Error adding item to cart:', error)
      // Refresh the product list so stale inventory_quantity values don't
      // keep the Add-to-Bag button enabled after an out-of-stock attempt.
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
    },
  })

  const updateItem = useMutation({
    mutationFn: async ({ lineId, quantity }: { lineId: string; quantity: number }) => {
      if (!cart) throw new Error('No cart available')

      const response = await getMedusaClient().store.cart.updateLineItem(cart.id, lineId, {
        quantity,
      })
      return response.cart
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart)
    },
  })

  // CORRECT: deleteLineItem returns cart in 'parent' field
  const removeItem = useMutation({
    mutationFn: async (lineId: string) => {
      if (!cart) throw new Error('No cart available')

      const response = await getMedusaClient().store.cart.deleteLineItem(cart.id, lineId)
      return response.parent // CORRECT: Use parent, not cart
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart)
    },
  })

  const applyPromoCode = useMutation({
    mutationFn: async (code: string) => {
      if (!cart) throw new Error('No cart available')
      const existingCodes = ((cart.promotions || []) as Promotion[]).map((p) => p.code)
      const response = await getMedusaClient().store.cart.update(cart.id, {
        promo_codes: [...existingCodes, code.trim().toUpperCase()],
      })
      return response.cart
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart)
    },
  })

  const removePromoCode = useMutation({
    mutationFn: async (code: string) => {
      if (!cart) throw new Error('No cart available')
      const existingCodes = ((cart.promotions || []) as Promotion[]).map((p) => p.code)
      const response = await getMedusaClient().store.cart.update(cart.id, {
        promo_codes: existingCodes.filter((c: string) => c !== code),
      })
      return response.cart
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart)
    },
  })

  const clearCart = () => {
    clearCartId()
    queryClient.invalidateQueries({ queryKey: ['cart'] })
  }

  const itemCount = cart?.items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) || 0
  const subtotal = (cart as any)?.original_item_subtotal ?? cart?.subtotal ?? 0
  const total = cart?.total || 0
  const appliedPromoCodes: string[] = ((cart?.promotions || []) as Promotion[]).map((p) => p.code)
  const discountTotal = (cart?.discount_total || 0) + ((cart as any)?.shipping_discount_total || 0)

  return {
    cart,
    isLoading,
    error,
    itemCount,
    subtotal,
    total,
    appliedPromoCodes,
    discountTotal,
    addItem: addItem.mutate,
    addItemAsync: addItem.mutateAsync,
    updateItem: updateItem.mutate,
    removeItem: removeItem.mutate,
    applyPromoCode: applyPromoCode.mutateAsync,
    removePromoCode: removePromoCode.mutateAsync,
    clearCart,
    isAddingItem: addItem.isPending,
    isUpdatingItem: updateItem.isPending,
    isRemovingItem: removeItem.isPending,
    isApplyingPromo: applyPromoCode.isPending,
    isRemovingPromo: removePromoCode.isPending,
  }
}
