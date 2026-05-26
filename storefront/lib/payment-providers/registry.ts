/**
 * Storefront-side payment provider registry.
 *
 * Mapping from Medusa provider id → UI implementation. The list of
 * AVAILABLE providers for a given cart comes from
 * /store/payment-providers?region_id=X (Medusa is the source of truth);
 * the registry just tells us which of those we can render.
 *
 * The AMBORAS:PAYMENT-PROVIDERS tagged blocks below are codemod targets
 * for future "payment provider" plugins (e.g. Klarna, Razorpay, Square).
 * Plugin install will inject an import line and a registry entry — the
 * existing forked storefronts pick up the new provider with no manual
 * file edits, mirroring the existing AMBORAS:REVIEWS / AMBORAS:KLAVIYO
 * plugin pattern. DO NOT remove the START/END comment markers.
 */

import { stripeConnectProvider } from './stripe-connect'
import { paypalProvider } from './paypal'
// AMBORAS:PAYMENT-PROVIDERS:IMPORT:START
// AMBORAS:PAYMENT-PROVIDERS:IMPORT:END
import type { PaymentProviderConfig } from './types'

export const PAYMENT_PROVIDER_REGISTRY: Record<string, PaymentProviderConfig> = {
  [stripeConnectProvider.id]: stripeConnectProvider,
  [paypalProvider.id]: paypalProvider,
  // AMBORAS:PAYMENT-PROVIDERS:START
  // AMBORAS:PAYMENT-PROVIDERS:END
}

/**
 * Returns the registered config for a Medusa provider id. Tries (1) an exact
 * id match, then (2) any registered config whose `matches(id)` returns true.
 * The fallback supports Medusa's `pp_<family>_<variant>` naming where the
 * suffix can vary (e.g. Stripe's payment-method variants).
 */
export function getPaymentProvider(id: string): PaymentProviderConfig | null {
  const exact = PAYMENT_PROVIDER_REGISTRY[id]
  if (exact) return exact
  for (const cfg of Object.values(PAYMENT_PROVIDER_REGISTRY)) {
    if (cfg.matches && cfg.matches(id)) return cfg
  }
  return null
}

/**
 * Filter and order a list of provider ids to only those we can actually
 * render. Order in input is preserved (Medusa returns them in a stable order).
 * De-duplicates configs (a single registry entry can match multiple Medusa ids).
 */
export function getRenderableProviders(ids: string[]): PaymentProviderConfig[] {
  const out: PaymentProviderConfig[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    const cfg = getPaymentProvider(id)
    if (cfg && !seen.has(cfg.id)) {
      out.push(cfg)
      seen.add(cfg.id)
    }
  }
  return out
}

export type { PaymentProviderConfig, PaymentProviderComponentProps } from './types'
