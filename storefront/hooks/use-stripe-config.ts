'use client'

import { useQuery } from '@tanstack/react-query'

interface StripeConfig {
  publishableKey: string | null
  stripeAccountId: string | null
  paymentReady: boolean
  isLoading: boolean
}

export function useStripeConfig(): StripeConfig {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
  const storeId = process.env.NEXT_PUBLIC_STORE_ID
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  const { data, isLoading } = useQuery({
    queryKey: ['stripe-config', storeId],
    queryFn: async () => {
      const headers: Record<string, string> = {}
      if (storeId) headers['X-Store-Environment-ID'] = storeId
      if (publishableKey) headers['x-publishable-api-key'] = publishableKey

      const res = await fetch(`${backendUrl}/store/stripe-connect`, { headers })
      if (!res.ok) throw new Error('Failed to fetch Stripe config')
      return res.json()
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  })

  return {
    publishableKey: data?.publishable_key || null,
    stripeAccountId: data?.stripe_account_id || null,
    paymentReady: data?.payment_ready || false,
    isLoading,
  }
}
