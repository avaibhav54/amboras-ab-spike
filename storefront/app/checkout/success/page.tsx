'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { trackPurchase } from '@/lib/analytics'
import { getMedusaClient } from '@/lib/medusa-client'
import { ClientPluginSlot } from '@/components/ClientPluginSlot'
import type { Order, OrderItem } from '@/types'

type PurchaseTrackingDetails = {
  value?: number
  currency?: string
  contentIds: string[]
  contents?: Array<{
    id: string
    quantity?: number
    item_price?: number
  }>
  numItems?: number
}

function toCurrencyValue(amount: number | null | undefined): number | undefined {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return undefined
  return Math.round(amount * 100) / 100
}

function buildPurchaseTrackingDetails(order: Order): PurchaseTrackingDetails {
  const items: OrderItem[] = Array.isArray(order?.items) ? order.items : []

  const contentIds = items
    .map((item: OrderItem) => item.variant_id || item.variant?.id || item.product_id)
    .filter(Boolean)

  const contents = items
    .map((item: OrderItem) => {
      const id = item.variant_id || item.variant?.id || item.product_id

      if (!id) {
        return null
      }

      return {
        id,
        quantity: item.quantity,
        item_price: toCurrencyValue(item.unit_price ?? item.total),
      }
    })
    .filter(Boolean) as Array<{
    id: string
    quantity?: number
    item_price?: number
  }>

  return {
    value: toCurrencyValue(order?.total),
    currency: order?.currency_code,
    contentIds,
    contents: contents.length > 0 ? contents : undefined,
    numItems: items.reduce((sum: number, item: OrderItem) => sum + (item.quantity || 0), 0),
  }
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')

  const analyticsTracked = useRef(false)
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseTrackingDetails | null>(null)
  const [purchaseDetailsLoaded, setPurchaseDetailsLoaded] = useState(false)

  useEffect(() => {
    if (!orderId || !purchaseDetailsLoaded || analyticsTracked.current) {
      return
    }

    analyticsTracked.current = true

    trackPurchase(orderId, {
      value: purchaseDetails?.value,
      currency: purchaseDetails?.currency,
      itemCount: purchaseDetails?.numItems,
      contentIds: purchaseDetails?.contentIds,
      contents: purchaseDetails?.contents,
    })
  }, [orderId, purchaseDetails, purchaseDetailsLoaded])

  useEffect(() => {
    if (!orderId) {
      setPurchaseDetails(null)
      setPurchaseDetailsLoaded(false)
      return
    }

    let cancelled = false

    const loadOrder = async () => {
      try {
        const { order } = await getMedusaClient().store.order.retrieve(orderId)

        if (!cancelled) {
          setPurchaseDetails(buildPurchaseTrackingDetails(order))
        }
      } catch {
        if (!cancelled) {
          setPurchaseDetails({
            contentIds: [orderId],
          })
        }
      } finally {
        if (!cancelled) {
          setPurchaseDetailsLoaded(true)
        }
      }
    }

    loadOrder()

    return () => {
      cancelled = true
    }
  }, [orderId])


  return (
    <div className="min-h-[calc(100vh-8rem)] px-6 py-12 sm:px-10 lg:py-16">
      <div className="mx-auto w-full max-w-[640px]">
        {/* Confirmation header */}
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full bg-emerald-500">
              <CheckCircle className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              {orderId && (
                <p className="text-sm text-muted-foreground">
                  Order <span className="font-mono">#{orderId.slice(-8).toUpperCase()}</span>
                </p>
              )}
              <h1 className="text-2xl font-semibold text-foreground">
                Thank you, your order is confirmed!
              </h1>
            </div>
          </div>

          <p className="text-sm text-foreground mb-8">
            You&rsquo;ll receive a confirmation email shortly. Once your order
            ships, we&rsquo;ll send you tracking information.
          </p>

          {/* Order details card */}
          <div className="rounded-md bg-muted/40 p-5 mb-6">
            <div className="flex items-start gap-3">
              <Package
                className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground"
                strokeWidth={1.5}
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  What happens next?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  We&rsquo;ll send you another email when your order is on its
                  way. You can also track it from your account.
                </p>
              </div>
            </div>
          </div>

          {/* checkoutComplete slot — purchase trackers, loyalty earn confirmation */}
          <ClientPluginSlot
            name="checkoutComplete"
            context={{
              orderId: orderId ?? undefined,
              total: purchaseDetails?.value,
              currency: purchaseDetails?.currency,
              itemCount: purchaseDetails?.numItems,
            }}
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6">
            <Link
              href="/products"
              style={{
                backgroundColor:
                  'var(--brand-primary, hsl(var(--foreground)))',
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Continue shopping
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/account/orders"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
            >
              View order
            </Link>
          </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container-custom py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  )
}
