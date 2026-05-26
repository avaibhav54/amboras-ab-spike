'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

export default function AnnouncementBar() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null
  if (pathname?.startsWith('/checkout')) return null

  return (
    <div className="relative bg-foreground text-primary-foreground">
      <div className="container-custom flex items-center justify-center py-2.5 text-sm tracking-wide">
        <p>Free shipping on orders over $75 — Shop the new collection</p>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 hover:opacity-70 transition-opacity"
          aria-label="Dismiss announcement"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
