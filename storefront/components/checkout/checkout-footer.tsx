'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { usePolicies } from '@/hooks/use-policies'

export default function CheckoutFooter() {
  const { policies } = usePolicies()

  const links: { label: string; href: string }[] = []
  if (policies?.refund_policy) links.push({ label: 'Refund policy', href: '/refund-policy' })
  if (policies?.shipping_policy) links.push({ label: 'Shipping policy', href: '/shipping' })
  if (policies?.privacy_policy) links.push({ label: 'Privacy policy', href: '/privacy' })
  if (policies?.terms_of_service) links.push({ label: 'Terms of service', href: '/terms' })

  const SecureBadge = (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Lock className="h-3 w-3" aria-hidden />
      <span>All transactions are secure and encrypted</span>
    </div>
  )

  const LinksNav = links.length > 0 ? (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-[hsl(var(--accent))] hover:underline underline-offset-4 transition-colors"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  ) : null

  return (
    <footer className="bg-background mt-auto">
      {/* Mobile: secure badge + links stacked, full padding. */}
      <div className="lg:hidden px-6 sm:px-10 py-6 flex flex-col gap-3 items-start">
        {SecureBadge}
        {LinksNav}
      </div>

      {/* Desktop: matches the page's half-and-half grid (links left under
          form, secure badge right under summary rail). */}
      <div className="hidden lg:grid lg:grid-cols-2">
        <div className="pl-14 pr-12 py-6 flex justify-end">
          <div className="w-full max-w-[520px] flex items-center">
            {LinksNav ?? SecureBadge}
          </div>
        </div>
        <div className="bg-muted/40 pl-12 pr-14 py-6 flex items-center">
          <div className="w-full max-w-[440px] flex items-center justify-end">
            {SecureBadge}
          </div>
        </div>
      </div>
    </footer>
  )
}
