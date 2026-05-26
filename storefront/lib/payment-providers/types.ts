/**
 * Payment provider registry types.
 *
 * To add a new provider:
 *   1. Create lib/payment-providers/<provider>.tsx that exports a
 *      PaymentProviderConfig (id, label, Component).
 *   2. Add it to PAYMENT_PROVIDER_REGISTRY in registry.ts.
 *   3. That's it. No edits to use-checkout, the picker, or the checkout
 *      page — they all read from the registry + the API.
 *
 * The registry is intentionally storefront-side only. Medusa's
 * /store/payment-providers endpoint is the source of truth for which
 * providers are AVAILABLE for the current cart's region; the registry just
 * tells us which provider IDs we have a UI implementation for. Anything
 * Medusa returns that's not in the registry is filtered out (so the
 * checkout never crashes on an unknown provider; it just hides it).
 */

import type { Cart } from '@/types'
import type { ComponentType } from 'react'

/**
 * Props every provider component receives. Provider-specific data lives in
 * `sessionData` (the raw `data` blob Medusa returned from
 * initiatePaymentSession) — each provider destructures what it needs.
 */
export interface PaymentProviderComponentProps {
  /** Active cart (for currency, total, etc.) */
  cart: Cart
  /** Raw `data` field from the initialized payment session, or null while loading */
  sessionData: Record<string, unknown> | null
  /** True while a network request is in flight — providers should disable interactive UI */
  isCompleting: boolean
  /** Called after the buyer authorizes payment. Parent runs `cart.complete()` and redirects. */
  onApproved: () => Promise<void>
  /** Called on provider-side error or buyer cancellation */
  onError: (msg: string) => void
  /**
   * One-page checkout hook. When provided, the adapter must NOT render its
   * own submit button — instead it registers a confirm function with the
   * outer "Pay now" bar. Call `registerConfirm(null)` on unmount to clear.
   *
   * Express-kind adapters (PayPal Smart Buttons, Apple/Google Pay) ignore
   * this prop entirely — those ARE the button.
   */
  registerConfirm?: (fn: (() => Promise<void>) | null) => void
}

export interface PaymentProviderConfig {
  /** Canonical Medusa payment provider id, e.g. 'pp_paypal_paypal'. Used as the registry key. */
  id: string
  /** Short human label for the picker button, e.g. 'PayPal' */
  label: string
  /**
   * Optional matcher for variant providers Medusa might expose under the same
   * family (e.g. `pp_stripe-bancontact_stripe`, `pp_paypal_paypal`). Default
   * is an exact match against `id`. Override with a prefix matcher if you
   * want one adapter to handle multiple Medusa provider ids.
   *
   * Mirrors the official Medusa storefront convention of detecting providers
   * via `provider_id.startsWith("pp_paypal_")`.
   */
  matches?: (providerId: string) => boolean
  /**
   * Layout hint for the Shopify-style stacked checkout:
   *   'express' → one-click options (PayPal, Apple Pay, Google Pay) — renders
   *               at the TOP of the payment step, branded buttons.
   *   'form'    → manual card entry (Stripe Elements) — renders BELOW the
   *               express row, separated by a divider.
   * Default: 'form'.
   */
  kind?: 'express' | 'form'
  /** React component that renders the form/buttons for this provider */
  Component: ComponentType<PaymentProviderComponentProps>
}
