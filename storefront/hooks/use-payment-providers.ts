'use client'

import { useQuery } from '@tanstack/react-query'
import { getMedusaClient } from '@/lib/medusa-client'
import { getRenderableProviders, type PaymentProviderConfig } from '@/lib/payment-providers/registry'

interface UsePaymentProvidersResult {
  providers: PaymentProviderConfig[]
  isLoading: boolean
}

/**
 * Source of truth for "which payment options should the buyer see at checkout."
 *
 * Reads from Medusa's /store/payment-providers?region_id=X — that endpoint
 * only returns providers that are linked to the cart's region (which is
 * gated by the merchant having connected the provider in admin, via the
 * region auto-link in M2.3).
 *
 * The result is filtered through the storefront's PAYMENT_PROVIDER_REGISTRY
 * so that any provider Medusa exposes which we don't have a UI for yet is
 * silently dropped (so we never crash on an unknown provider id).
 *
 * If the result is empty (no merchant-connected providers, OR none of them
 * are in the registry), the checkout falls back to demo / system_default
 * mode — handled by the caller.
 */
export function usePaymentProviders(regionId: string | undefined): UsePaymentProvidersResult {
  const { data, isLoading } = useQuery({
    queryKey: ['payment-providers', regionId],
    queryFn: async () => {
      if (!regionId) return [] as string[]
      const res = await getMedusaClient().store.payment.listPaymentProviders({ region_id: regionId })
      return ((res as any)?.payment_providers ?? []).map((p: { id: string }) => p.id) as string[]
    },
    enabled: !!regionId,
    staleTime: 60_000,
  })

  return {
    providers: getRenderableProviders(data ?? []),
    isLoading,
  }
}
