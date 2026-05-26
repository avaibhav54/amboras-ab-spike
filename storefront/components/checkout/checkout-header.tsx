'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useBrand } from '@/hooks/use-brand'
import CartDrawer from '@/components/cart/cart-drawer'
import { useCartDrawerOpener } from '@/lib/cart-ui'

export default function CheckoutHeader() {
  const { itemCount } = useCart()
  const { brand } = useBrand()
  const [isCartOpen, setIsCartOpen] = useState(false)
  useCartDrawerOpener(setIsCartOpen)

  const storeName = brand?.storeName || 'Store'
  const logoUrl = brand?.logoUrl

  return (
    <>
      <header className="bg-background px-6 sm:px-10 lg:px-14">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" aria-label={`${storeName} home`}>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={storeName}
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            ) : (
              <span className="font-heading text-2xl font-semibold tracking-tight">
                {storeName}
              </span>
            )}
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 hover:opacity-70 transition-opacity"
            aria-label="Shopping bag"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
