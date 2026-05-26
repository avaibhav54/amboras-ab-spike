// Type definitions for Medusa SDK responses
// Using the actual response types from the SDK

export type Product = {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  handle: string
  thumbnail?: string | null
  variants?: ProductVariant[]
  images?: ProductImage[]
  options?: ProductOption[]
  created_at: string
  updated_at: string
}

export type ProductVariant = {
  id: string
  title: string
  sku?: string | null
  inventory_quantity?: number
  allow_backorder: boolean
  prices?: ProductVariantPrice[]
  options?: Record<string, string>
  product_id: string
  created_at: string
  updated_at: string
}

export type ProductVariantPrice = {
  id: string
  amount: number
  currency_code: string
  variant_id: string
}

export type ProductImage = {
  id: string
  url: string
  created_at: string
  updated_at: string
}

export type ProductOption = {
  id: string
  title: string
  values: string[]
  product_id: string
}

export type Cart = {
  id: string
  items: LineItem[]
  subtotal: number
  total: number
  original_item_total?: number
  original_item_subtotal?: number
  region_id?: string
  created_at: string
  updated_at: string
}

export type LineItem = {
  id: string
  title: string
  subtitle?: string
  thumbnail?: string | null
  quantity: number
  unit_price: number
  total: number
  variant_id: string
  variant?: ProductVariant
  cart_id: string
  created_at: string
  updated_at: string
}

export type Order = {
  id: string
  display_id: number
  status: string
  email: string
  currency_code: string
  total: number
  subtotal: number
  tax_total: number
  discount_total: number
  shipping_total: number
  payment_status: 'not_paid' | 'awaiting' | 'authorized' | 'partially_authorized' | 'captured' | 'partially_captured' | 'partially_refunded' | 'refunded' | 'canceled' | 'requires_action'
  fulfillment_status: 'not_fulfilled' | 'partially_fulfilled' | 'fulfilled' | 'partially_shipped' | 'shipped' | 'partially_returned' | 'returned' | 'canceled' | 'requires_action'
  created_at: string
  updated_at: string
  items: OrderItem[]
  shipping_address?: Address
  billing_address?: Address
  shipping_methods?: ShippingMethod[]
  payment_collections?: PaymentCollection[]
  fulfillments?: Fulfillment[]
}

export type OrderItem = {
  id: string
  title: string
  subtitle?: string
  thumbnail?: string | null
  variant_id: string
  product_id: string
  product_title: string
  product_handle: string
  variant_title?: string
  quantity: number
  unit_price: number
  subtotal: number
  total: number
  tax_total: number
  discount_total: number
  refundable_total: number
  detail?: {
    quantity: number
    fulfilled_quantity: number
    shipped_quantity: number
    delivered_quantity: number
    return_requested_quantity: number
    return_received_quantity: number
  }
  variant?: ProductVariant
}

export type Address = {
  id: string
  first_name: string
  last_name: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
  phone?: string
}

export type ShippingMethod = {
  id: string
  name: string
  description?: string
  amount: number
  total: number
  tax_total: number
}

export type PaymentCollection = {
  id: string
  amount: number
  authorized_amount?: number
  captured_amount?: number
  refunded_amount?: number
  currency_code: string
  status: string
  completed_at?: string
}

export type Fulfillment = {
  id: string
  tracking_numbers?: string[]
  tracking_links?: string[]
  labels?: FulfillmentLabel[]
  provider_id?: string
  packed_at?: string
  shipped_at?: string
  delivered_at?: string
  canceled_at?: string
  created_at: string
  items?: FulfillmentItem[]
}

export type FulfillmentLabel = {
  id: string
  tracking_number: string
  tracking_url: string
  label_url?: string
  fulfillment_id: string
  created_at: string
  updated_at: string
}

export type FulfillmentItem = {
  id: string
  line_item_id: string
  quantity: number
}

export type CartLineItem = {
  id: string
  title: string
  thumbnail?: string | null
  quantity: number
  unit_price: number
  total: number
  product_id?: string
  variant_id?: string
  variant?: { title?: string }
  is_tax_inclusive?: boolean
}

export type Promotion = {
  id: string
  code: string
  type?: string
  value?: number
}

export type ShippingOption = {
  id: string
  name: string
  amount?: number
  prices?: { amount: number }[]
  type?: {
    label: string
    description?: string
  }
}
