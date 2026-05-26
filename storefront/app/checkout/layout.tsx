import CheckoutHeader from '@/components/checkout/checkout-header'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="checkout-shopify-theme min-h-screen flex flex-col bg-background text-foreground">
      <CheckoutHeader />
      <div className="flex-1">{children}</div>
    </div>
  )
}
