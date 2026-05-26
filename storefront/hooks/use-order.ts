'use client'

import { useQuery } from '@tanstack/react-query'
import { getMedusaClient } from '@/lib/medusa-client'
import type { Order } from '@/types'

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await getMedusaClient().store.order.retrieve(orderId, {
        fields: '+payment_status,+fulfillment_status,*payment_collections,*items,*shipping_address,*billing_address,*fulfillments,*fulfillments.items,*fulfillments.labels,*shipping_methods',
      })
      return response.order as Order
    },
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })
}
