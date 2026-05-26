'use client'

import { useQuery } from '@tanstack/react-query'

interface BrandSettings {
  logo_url?: string | null
  square_logo_url?: string | null
  cover_image_url?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  description?: string | null
  slogan?: string | null
}

interface BrandResponse {
  brand: BrandSettings
  store: {
    name: string
  }
}

export function useBrand() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['brand-settings'],
    queryFn: async () => {
      // Fetch brand data from public /store/brand endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/brand`,
        {
          headers: {
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
            'X-Store-Environment-ID': process.env.NEXT_PUBLIC_STORE_ID || '',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch brand settings')
      }

      const data: BrandResponse = await response.json()
      const brandSettings = data.brand

      return {
        logoUrl: brandSettings.logo_url,
        squareLogoUrl: brandSettings.square_logo_url,
        coverImageUrl: brandSettings.cover_image_url,
        primaryColor: brandSettings.primary_color,
        secondaryColor: brandSettings.secondary_color,
        description: brandSettings.description,
        slogan: brandSettings.slogan,
        storeName: data.store.name || 'Store',
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes — brand settings rarely change
  })

  return {
    brand: data,
    isLoading,
    error,
    // Helper to check if brand is customized
    hasCustomBrand: !!(data?.logoUrl || data?.primaryColor),
  }
}
