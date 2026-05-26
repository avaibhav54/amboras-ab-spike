'use client'

import { useEffect } from 'react'

/**
 * Pubsub helper for opening the cart drawer from anywhere in the storefront.
 *
 * Replaces the "Added to bag" toast on add-to-cart: now the drawer opens
 * directly so the buyer immediately sees what's in their cart. Because the
 * drawer lives inside the layout's <Header> (and <CheckoutHeader>) — far
 * from where add-to-cart fires on product pages / cards — we use a
 * lightweight DOM CustomEvent instead of dragging cross-tree state.
 *
 * The header components subscribe via `useCartDrawerOpener(setIsOpen)`;
 * anything that wants to surface the cart calls `openCartDrawer()`.
 */

const OPEN_CART_EVENT = 'amboras:open-cart-drawer'

/** Fire from anywhere to surface the cart drawer in whichever header is mounted. */
export function openCartDrawer() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))
}

/** Subscribe from a header component that owns the drawer's open state. */
export function useCartDrawerOpener(setOpen: (open: boolean) => void) {
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener(OPEN_CART_EVENT, handler)
    return () => window.removeEventListener(OPEN_CART_EVENT, handler)
  }, [setOpen])
}
