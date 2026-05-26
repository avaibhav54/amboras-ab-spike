'use client'

import { useQuery } from '@tanstack/react-query'

interface PayPalConfig {
  clientId: string | null
  environment: 'sandbox' | 'live' | null
  paymentReady: boolean
  isLoading: boolean
}

/**
 * Fetch the per-tenant PayPal public config for Smart Buttons.
 * Mirror of use-stripe-config.ts. Returns paymentReady=false (not an error)
 * when the merchant hasn't connected PayPal — the checkout UI uses that
 * to hide the option from the picker.
 */
export function usePayPalConfig(): PayPalConfig {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
  const storeId = process.env.NEXT_PUBLIC_STORE_ID
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  const { data, isLoading } = useQuery({
    queryKey: ['paypal-config', storeId],
    queryFn: async () => {
      const headers: Record<string, string> = {}
      if (storeId) headers['X-Store-Environment-ID'] = storeId
      if (publishableKey) headers['x-publishable-api-key'] = publishableKey

      const res = await fetch(`${backendUrl}/store/paypal-connect`, { headers })
      if (!res.ok) throw new Error('Failed to fetch PayPal config')
      return res.json()
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  })

  return {
    clientId: data?.client_id || null,
    environment: data?.environment || null,
    paymentReady: data?.payment_ready || false,
    isLoading,
  }
}
