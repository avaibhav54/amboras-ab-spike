export default function CollectionDetailLoading() {
  return (
    <>
      {/* Breadcrumbs Skeleton */}
      <div className="border-b">
        <div className="container-custom py-3">
          <div className="h-3 w-48 bg-muted rounded animate-pulse" />
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        {/* Header Skeleton */}
        <div className="mb-10 animate-pulse">
          <div className="h-3 w-20 bg-muted rounded mb-2" />
          <div className="h-8 w-64 bg-muted rounded mb-2" />
          <div className="h-4 w-96 bg-muted rounded" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              {/* Image Skeleton */}
              <div className="relative aspect-[3/4] overflow-hidden bg-muted rounded-sm" />

              {/* Title Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
