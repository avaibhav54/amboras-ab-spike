'use client'

import { useProducts } from '@/hooks/use-products'
import { useQuery } from '@tanstack/react-query'
import ProductCard from './product-card'
import { AlertCircle, Package } from 'lucide-react'

interface ProductGridProps {
  limit?: number
  collectionId?: string
  categoryId?: string
  sortBy?: string
  query?: string
}

function ProductSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="aspect-[3/4] bg-muted rounded-sm" />
      <div className="space-y-2">
        <div className="h-3.5 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
    </div>
  )
}

export default function ProductGrid({
  limit = 8,
  collectionId,
  categoryId,
  sortBy = 'newest',
  query,
}: ProductGridProps) {
  const { data: rawProducts, isLoading, error } = useProducts({
    limit,
    collection_id: collectionId,
    category_id: categoryId,
    q: query,
  })

  const productIds = rawProducts?.map((p: any) => p.id) || []
  const { data: variantExtensions } = useQuery({
    queryKey: ['variant-extensions', productIds],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const storeId = process.env.NEXT_PUBLIC_STORE_ID
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (storeId) headers['X-Store-Environment-ID'] = storeId
      if (publishableKey) headers['x-publishable-api-key'] = publishableKey

      try {
        const res = await fetch(
          `${baseUrl}/store/product-extensions/variants/batch`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ product_ids: productIds }),
          },
        )
        if (!res.ok) return {}
        const data = await res.json()
        const results: Record<string, { compare_at_price: number | null; allow_backorder: boolean; inventory_quantity: number | null }> = {}
        for (const v of data.variants || []) {
          results[v.id] = {
            compare_at_price: v.compare_at_price,
            allow_backorder: v.allow_backorder ?? false,
            inventory_quantity: v.inventory_quantity,
          }
        }
        return results
      } catch {
        return {}
      }
    },
    enabled: productIds.length > 0,
    staleTime: 1000 * 60 * 5,
  })

  const products = rawProducts
    ? [...rawProducts].sort((a, b) => {
        switch (sortBy) {
          case 'price-low': {
            const pa = a.variants?.[0]?.calculated_price?.calculated_amount || 0
            const pb = b.variants?.[0]?.calculated_price?.calculated_amount || 0
            return pa - pb
          }
          case 'price-high': {
            const pa = a.variants?.[0]?.calculated_price?.calculated_amount || 0
            const pb = b.variants?.[0]?.calculated_price?.calculated_amount || 0
            return pb - pa
          }
          case 'name':
            return (a.title || '').localeCompare(b.title || '')
          default:
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        }
      })
    : rawProducts

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: limit }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-dashed rounded-sm p-12 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-3 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Failed to load products'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm font-semibold underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="border border-dashed rounded-sm p-12 text-center">
        <Package className="mx-auto h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-3 text-sm text-muted-foreground">No products available yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product: any) => (
        <ProductCard key={product.id} product={product} variantExtensions={variantExtensions} />
      ))}
    </div>
  )
}
