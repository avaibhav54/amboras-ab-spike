import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container-custom flex flex-col items-center justify-center py-section text-center">
      <p className="text-8xl font-heading font-semibold text-muted-foreground/20">404</p>
      <h1 className="mt-4 text-h2 font-heading font-semibold">Page Not Found</h1>
      <p className="mt-3 text-muted-foreground max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="bg-foreground text-background px-8 py-3 text-sm font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
        <Link
          href="/products"
          className="border border-foreground px-8 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-foreground hover:text-background transition-colors"
        >
          Shop All
        </Link>
      </div>
    </div>
  )
}
