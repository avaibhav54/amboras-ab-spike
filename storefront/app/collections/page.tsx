import { medusaServerClient } from '@/lib/medusa-client'
import Link from 'next/link'
import { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Collections' }

async function getCollections() {
  try {
    const response = await medusaServerClient.store.collection.list({ limit: 50 })
    return response.collections || []
  } catch {
    return []
  }
}

export default async function CollectionsPage() {
  const collections = await getCollections()

  return (
    <>
      <div className="border-b">
        <div className="container-custom py-section-sm text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-2">Browse</p>
          <h1 className="text-h1 font-heading font-semibold">Collections</h1>
        </div>
      </div>

      <div className="container-custom py-section">
        {collections.length === 0 ? (
          <p className="text-center text-muted-foreground">No collections available yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection: any) => {
              const description = typeof collection.metadata?.description === 'string'
                ? collection.metadata.description
                : null

              return (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.handle}`}
                  className="group block border rounded-sm p-8 hover:border-foreground transition-colors"
                >
                  <h2 className="text-h3 font-heading font-semibold group-hover:underline underline-offset-4">
                    {collection.title}
                  </h2>
                  {description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{description}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                    Shop Now <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
