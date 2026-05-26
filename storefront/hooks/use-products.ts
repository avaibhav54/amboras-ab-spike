'use client'

import { useQuery } from '@tanstack/react-query'
import { getMedusaClient } from '@/lib/medusa-client'
import { useRegion } from './use-region'

interface UseProductsOptions {
  limit?: number
  offset?: number
  collection_id?: string
  category_id?: string
  q?: string
}

export function useProducts(options: UseProductsOptions = {}) {
  const { regionId } = useRegion()

  return useQuery({
    queryKey: ['products', regionId, options],
    queryFn: async () => {
      if (!regionId) throw new Error('No region available')

      const response = await getMedusaClient().store.product.list({
        limit: options.limit || 100,
        offset: options.offset || 0,
        q: options.q || undefined,
        collection_id: options.collection_id ? [options.collection_id] : undefined,
        category_id: options.category_id ? [options.category_id] : undefined,
        region_id: regionId,
        fields: '*variants.calculated_price',
      })

      return response.products
    },
    enabled: !!regionId,
    staleTime: 1000 * 60 * 5,
  })
}
