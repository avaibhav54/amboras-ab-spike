'use client'

import { useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import ProductGrid from '@/components/product/product-grid'
import { ClientPluginSlot } from '@/components/ClientPluginSlot'

export default function SearchPage() {
  const [query, setQuery] = useState('')

  return (
    <>
      <div className="border-b">
        <div className="container-custom py-section-sm">
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                autoFocus
                className="w-full border-b border-foreground/20 bg-transparent pl-8 pr-4 py-4 text-lg font-heading placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {query ? (
          <>
            <p className="text-sm text-muted-foreground mb-8">
              Showing results for &ldquo;{query}&rdquo;
            </p>
            {/* Search ads, filter enhancements */}
            <ClientPluginSlot name="searchAboveResults" context={{ query }} />
            <ProductGrid limit={20} query={query} />
          </>
        ) : (
          <div className="text-center py-16">
            <SearchIcon className="mx-auto h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="mt-4 text-muted-foreground">Start typing to search products</p>
          </div>
        )}
      </div>
    </>
  )
}
