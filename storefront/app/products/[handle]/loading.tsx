export default function ProductDetailLoading() {
  return (
    <>
      {/* Breadcrumbs Skeleton */}
      <div className="border-b">
        <div className="container-custom py-3">
          <div className="h-3 w-48 bg-muted rounded animate-pulse" />
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Product Images Skeleton */}
          <div className="space-y-3 animate-pulse">
            <div className="relative aspect-[3/4] overflow-hidden bg-muted rounded-sm" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="relative aspect-[3/4] overflow-hidden bg-muted rounded-sm" />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6 animate-pulse">
            {/* Title */}
            <div className="space-y-2">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-8 w-3/4 bg-muted rounded" />
            </div>

            {/* Price */}
            <div className="h-6 w-32 bg-muted rounded" />

            {/* Variant Selector */}
            <div className="space-y-3">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 w-16 bg-muted rounded" />
                ))}
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="h-12 w-full bg-muted rounded" />

            {/* Trust Signals */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="h-5 w-5 bg-muted rounded mx-auto" />
                  <div className="h-3 w-16 bg-muted rounded mx-auto" />
                </div>
              ))}
            </div>

            {/* Accordion Skeleton */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 w-full bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
