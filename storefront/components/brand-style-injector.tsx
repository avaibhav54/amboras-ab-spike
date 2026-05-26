'use client'

import { useBrand } from '@/hooks/use-brand'
import { useEffect } from 'react'

/**
 * BrandStyleInjector
 *
 * Injects CSS custom properties based on brand settings.
 * Allows dynamic theming based on store's brand colors.
 *
 * Usage: Add to root layout
 */
export function BrandStyleInjector() {
  const { brand } = useBrand()

  useEffect(() => {
    if (!brand) return

    const root = document.documentElement

    // Inject primary color
    if (brand.primaryColor) {
      root.style.setProperty('--brand-primary', brand.primaryColor)
    }

    // Inject secondary color
    if (brand.secondaryColor) {
      root.style.setProperty('--brand-secondary', brand.secondaryColor)
    }

    // Cleanup on unmount
    return () => {
      root.style.removeProperty('--brand-primary')
      root.style.removeProperty('--brand-secondary')
    }
  }, [brand])

  // This component doesn't render anything
  return null
}
