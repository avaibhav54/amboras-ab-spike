'use client'

import { useOrder } from '@/hooks/use-order'
import AccountLayout from '@/components/account/account-layout'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Package, Truck, CheckCircle2, XCircle, Clock, Loader2, MapPin, CreditCard } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format-price'
import { getProductPlaceholder } from '@/lib/utils/placeholder-images'
import TrackingInfo from '@/components/order/tracking-info'
import type { Order, OrderItem } from '@/types'

// Status badge component
function StatusBadge({ status, type }: { status: string; type: 'order' | 'payment' | 'fulfillment' }) {
  const getConfig = () => {
    if (type === 'payment') {
      switch (status) {
        case 'captured':
        case 'paid':
          return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2, label: 'Paid' }
        case 'awaiting':
        case 'not_paid':
          return { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock, label: status === 'not_paid' ? 'Not Paid' : 'Awaiting Payment' }
        case 'refunded':
        case 'partially_refunded':
          return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2, label: status === 'refunded' ? 'Refunded' : 'Partially Refunded' }
        case 'canceled':
          return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: XCircle, label: 'Canceled' }
        default:
          return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock, label: status }
      }
    }

    if (type === 'fulfillment') {
      switch (status) {
        case 'fulfilled':
        case 'shipped':
          return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2, label: 'Fulfilled' }
        case 'partially_fulfilled':
        case 'partially_shipped':
          return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Truck, label: 'Partially Fulfilled' }
        case 'not_fulfilled':
          return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Package, label: 'Not Fulfilled' }
        default:
          return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Package, label: status }
      }
    }

    // Order status
    switch (status) {
      case 'completed':
        return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2, label: 'Completed' }
      case 'pending':
        return { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pending' }
      case 'canceled':
        return { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Canceled' }
      default:
        return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock, label: status }
    }
  }

  const config = getConfig()
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

// Order timeline component
function OrderTimeline({ order }: { order: Order }) {
  const fulfillmentStatus = order.fulfillment_status as string
  const hasShipped = fulfillmentStatus === 'shipped' || fulfillmentStatus === 'partially_shipped' || fulfillmentStatus === 'delivered'
  const hasDelivered = fulfillmentStatus === 'delivered'

  const steps = [
    { label: 'Placed', completed: true },
    { label: 'Paid', completed: order.payment_status === 'captured' || (order.payment_status as string) === 'paid' },
    { label: 'Shipped', completed: hasShipped },
    { label: 'Delivered', completed: hasDelivered },
  ]

  return (
    <div className="flex items-center justify-between gap-2">
      {steps.map((step, idx) => (
        <div key={step.label} className="flex-1 flex items-center">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
              step.completed
                ? 'bg-accent border-accent text-white'
                : 'bg-background border-muted text-muted-foreground'
            }`}>
              {step.completed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">{idx + 1}</span>
              )}
            </div>
            <span className={`mt-2 text-xs font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`h-0.5 flex-1 -mt-6 ${step.completed && steps[idx + 1].completed ? 'bg-accent' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// Order item component
function OrderItemCard({ item, currencyCode }: { item: OrderItem; currencyCode: string }) {
  const thumbnail = item.thumbnail || getProductPlaceholder(item.product_id)
  const unitPrice = formatPrice(item.unit_price, currencyCode)
  const total = formatPrice(item.total, currencyCode)

  const getFulfillmentStatus = () => {
    if (!item.detail) return 'Pending'
    const { quantity, fulfilled_quantity, shipped_quantity, delivered_quantity } = item.detail

    if (delivered_quantity > 0) {
      return delivered_quantity >= quantity ? 'Delivered' : `Partially delivered (${delivered_quantity}/${quantity})`
    }
    if (shipped_quantity > 0) {
      return shipped_quantity >= quantity ? 'Shipped' : `Partially shipped (${shipped_quantity}/${quantity})`
    }
    if (fulfilled_quantity > 0) {
      return fulfilled_quantity >= quantity ? 'Fulfilled' : `Partially fulfilled (${fulfilled_quantity}/${quantity})`
    }
    return 'Not shipped'
  }

  return (
    <div className="flex gap-4 py-4 border-b last:border-0">
      <Link href={`/products/${item.product_handle}`} className="relative w-20 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
        <Image
          src={thumbnail}
          alt={item.title}
          fill
          sizes="80px"
          className="object-cover"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.product_handle}`} className="hover:underline">
          <h4 className="font-medium text-sm">{item.product_title}</h4>
        </Link>
        {item.variant_title && item.variant_title !== 'Default' && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.variant_title}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Qty: {item.quantity} × {unitPrice}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Status: {getFulfillmentStatus()}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-medium text-sm">{total}</p>
      </div>
    </div>
  )
}

// Address card component
function AddressCard({ title, address, icon: Icon }: { title: string; address: Order['shipping_address']; icon: any }) {
  if (!address) return null

  return (
    <div className="border rounded-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <div className="text-sm space-y-1">
        <p className="font-medium">
          {address.first_name} {address.last_name}
        </p>
        {address.company && <p>{address.company}</p>}
        <p>{address.address_1}</p>
        {address.address_2 && <p>{address.address_2}</p>}
        <p>
          {address.city}
          {address.province && `, ${address.province}`} {address.postal_code}
        </p>
        {address.phone && <p className="text-muted-foreground">{address.phone}</p>}
      </div>
    </div>
  )
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const { data: order, isLoading, error } = useOrder(resolvedParams.id)

  return (
    <AccountLayout>
      <div>
        {/* Back button */}
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to orders
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !order ? (
          <div className="border border-dashed rounded-sm p-12 text-center">
            <Package className="h-8 w-8 mx-auto text-muted-foreground/40" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-muted-foreground">Order not found</p>
            <Link
              href="/account/orders"
              className="mt-4 inline-block text-sm font-semibold underline underline-offset-4"
            >
              View all orders
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="border-b pb-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-h2 font-heading font-semibold">
                    Order #{order.display_id}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={order.status} type="order" />
                  <StatusBadge status={order.payment_status} type="payment" />
                  <StatusBadge status={order.fulfillment_status} type="fulfillment" />
                </div>
              </div>

              {/* Order Timeline */}
              <div className="mt-6">
                <OrderTimeline order={order} />
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Items */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Items */}
                <div className="border rounded-sm p-5">
                  <h2 className="font-medium mb-4">Order Items</h2>
                  <div>
                    {order.items.map((item) => (
                      <OrderItemCard
                        key={item.id}
                        item={item}
                        currencyCode={order.currency_code}
                      />
                    ))}
                  </div>
                </div>

                {/* Shipping & Billing Addresses */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <AddressCard
                    title="Shipping Address"
                    address={order.shipping_address}
                    icon={MapPin}
                  />
                  <AddressCard
                    title="Billing Address"
                    address={order.billing_address}
                    icon={CreditCard}
                  />
                </div>

                {/* Shipping & Tracking */}
                <div className="border rounded-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">Shipping & Tracking</h3>
                  </div>

                  {/* Shipping Method */}
                  {order.shipping_methods && order.shipping_methods.length > 0 && (
                    <div className="pb-4">
                      {order.shipping_methods.map((method) => (
                        <div key={method.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{method.name}</p>
                            {method.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {method.description}
                              </p>
                            )}
                          </div>
                          <p className="text-sm font-medium">
                            {method.amount === 0
                              ? 'Free'
                              : formatPrice(method.amount, order.currency_code)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Enhanced Tracking Info */}
                  {order.fulfillments && order.fulfillments.length > 0 ? (
                    <div className="space-y-4">
                      {order.fulfillments.map((fulfillment, idx) => (
                        <div key={fulfillment.id}>
                          {idx > 0 && <div className="border-t my-4" />}
                          <TrackingInfo
                            fulfillment={fulfillment}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Tracking information will be available once your order ships
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="border rounded-sm p-5 sticky top-24">
                  <h2 className="font-medium mb-4">Order Summary</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(order.subtotal, order.currency_code)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>
                        {order.shipping_total === 0
                          ? 'Free'
                          : formatPrice(order.shipping_total, order.currency_code)}
                      </span>
                    </div>
                    {order.tax_total > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatPrice(order.tax_total, order.currency_code)}</span>
                      </div>
                    )}
                    {order.discount_total > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatPrice(order.discount_total, order.currency_code)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>{formatPrice(order.total, order.currency_code)}</span>
                    </div>
                  </div>

                  {/* Payment Info */}
                  {order.payment_collections && order.payment_collections.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="text-sm font-medium mb-2">Payment Information</h3>
                      {order.payment_collections.map((payment) => (
                        <div key={payment.id} className="text-xs text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span>{formatPrice(payment.amount, payment.currency_code)}</span>
                          </div>
                          {payment.captured_amount !== null && payment.captured_amount !== undefined && (
                            <div className="flex justify-between">
                              <span>Captured:</span>
                              <span>{formatPrice(payment.captured_amount, payment.currency_code)}</span>
                            </div>
                          )}
                          {payment.refunded_amount && payment.refunded_amount > 0 && (
                            <div className="flex justify-between text-blue-600">
                              <span>Refunded:</span>
                              <span>{formatPrice(payment.refunded_amount, payment.currency_code)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  )
}

// Import React for use hook
import React from 'react'
