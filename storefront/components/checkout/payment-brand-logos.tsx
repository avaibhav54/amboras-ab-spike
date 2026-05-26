'use client'

/**
 * Inline-SVG payment-brand badges shown next to the Stripe payment method
 * label (Shopify pattern: "Pay with card  [Visa] [Mastercard] [Amex] ...").
 *
 * Kept as inline SVGs so we don't take a dependency on an external icon set
 * and don't trigger any extra HTTP loads. Each badge is sized to ~38×24px
 * (Shopify's checkout standard) with a thin border and brand-coloured marks.
 *
 * To customize the set per provider, pass a `brands` prop (default is the
 * Stripe Connect happy-path coverage in most regions: Visa, Mastercard,
 * Amex, plus Discover and Diners optionally).
 */

const BADGE_BASE =
  'inline-flex h-6 w-9 items-center justify-center rounded border border-border bg-white shrink-0'

function Visa() {
  return (
    <div className={BADGE_BASE} aria-label="Visa">
      <svg viewBox="0 0 36 12" className="h-3 w-auto" aria-hidden>
        <text
          x="0"
          y="10"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11"
          fontWeight="900"
          fontStyle="italic"
          letterSpacing="-0.3"
          fill="#1A1F71"
        >
          VISA
        </text>
      </svg>
    </div>
  )
}

function Mastercard() {
  return (
    <div className={BADGE_BASE} aria-label="Mastercard">
      <svg viewBox="0 0 24 14" className="h-4 w-auto" aria-hidden>
        <circle cx="9" cy="7" r="5" fill="#EB001B" />
        <circle cx="15" cy="7" r="5" fill="#F79E1B" />
        <path
          d="M12 3.2a4.99 4.99 0 0 1 0 7.6 4.99 4.99 0 0 1 0-7.6Z"
          fill="#FF5F00"
        />
      </svg>
    </div>
  )
}

function Amex() {
  return (
    <div
      className="inline-flex h-6 w-9 items-center justify-center rounded border border-border shrink-0"
      style={{ backgroundColor: '#006FCF' }}
      aria-label="American Express"
    >
      <svg viewBox="0 0 36 12" className="h-2.5 w-auto" aria-hidden>
        <text
          x="18"
          y="10"
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="10"
          fontWeight="900"
          fill="white"
          letterSpacing="0.2"
        >
          AMEX
        </text>
      </svg>
    </div>
  )
}

function Discover() {
  return (
    <div
      className="inline-flex h-6 w-9 items-center justify-center rounded border border-border bg-white shrink-0"
      aria-label="Discover"
    >
      <svg viewBox="0 0 36 12" className="h-3 w-auto" aria-hidden>
        <text
          x="0"
          y="10"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="7"
          fontWeight="700"
          fill="#231F20"
        >
          DISCOVER
        </text>
        <circle cx="33" cy="6" r="2.5" fill="#FF6000" />
      </svg>
    </div>
  )
}

export type SupportedBrand = 'visa' | 'mastercard' | 'amex' | 'discover'

interface PaymentBrandLogosProps {
  /** Defaults to the standard Stripe-Connect happy path. */
  brands?: SupportedBrand[]
  className?: string
}

const REGISTRY: Record<SupportedBrand, React.ComponentType> = {
  visa: Visa,
  mastercard: Mastercard,
  amex: Amex,
  discover: Discover,
}

export function PaymentBrandLogos({
  brands = ['visa', 'mastercard', 'amex'],
  className = '',
}: PaymentBrandLogosProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {brands.map((b) => {
        const Logo = REGISTRY[b]
        return Logo ? <Logo key={b} /> : null
      })}
    </div>
  )
}
