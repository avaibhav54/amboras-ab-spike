export default function ProductsLoading() {
  return (
    <div className="container-custom py-8 lg:py-12">
      {/* Header Skeleton */}
      <div className="mb-8 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
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
  )
}
