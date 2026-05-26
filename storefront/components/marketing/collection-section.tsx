'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductGrid from '@/components/product/product-grid'

interface CollectionSectionProps {
  collection: any
  alternate?: boolean
}

export default function CollectionSection({ collection, alternate }: CollectionSectionProps) {
  const description = collection.metadata?.description
  const hasDescription = typeof description === 'string' && description

  return (
    <section className={`py-section ${alternate ? 'bg-muted/30' : ''}`}>
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Collection
            </p>
            <h2 className="text-h2 font-heading font-semibold">
              {collection.title}
            </h2>
            {hasDescription && (
              <p className="text-muted-foreground mt-2 max-w-lg">{description}</p>
            )}
          </div>
          <Link
            href={`/collections/${collection.handle}`}
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide link-underline pb-0.5 whitespace-nowrap"
            prefetch={true}
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ProductGrid collectionId={collection.id} limit={4} />
      </div>
    </section>
  )
}
