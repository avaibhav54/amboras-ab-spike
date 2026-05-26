import { Metadata } from 'next'
import { FaqAccordion } from './faq-accordion'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about orders, shipping, returns, and more.',
}

const faqs = [
  { q: 'How long does shipping take?', a: 'Standard shipping takes 5-7 business days within the US. Express shipping (2-3 business days) is available at checkout. International orders typically arrive within 10-14 business days.' },
  { q: 'Do you ship internationally?', a: 'Yes! We ship to most countries worldwide. International shipping rates and delivery times vary by destination. You\'ll see the exact cost at checkout.' },
  { q: 'How do I track my order?', a: 'Once your order ships, you\'ll receive a confirmation email with a tracking number. You can also check your order status anytime through your account dashboard.' },
  { q: 'Are your products sustainably made?', a: 'We prioritize working with artisans and manufacturers who use ethical practices and sustainable materials. All packaging is recycled and recyclable, and we offset carbon emissions from every shipment.' },
  { q: 'Can I modify or cancel my order?', a: 'Orders can be modified or cancelled within 2 hours of placement. After that, we begin processing and may not be able to make changes. Contact us immediately if you need help.' },
  { q: 'Do you offer gift wrapping?', a: 'Yes, we offer complimentary gift wrapping on all orders. Simply select the gift wrap option at checkout and include a personalized message.' },
  { q: 'How do I care for my products?', a: 'Care instructions are included with every product and available on each product page. When in doubt, follow the care label attached to the item or contact us for guidance.' },
]

export default function FaqPage() {
  return (
    <>
      <div className="border-b">
        <div className="container-custom py-section-sm text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-2">Support</p>
          <h1 className="text-h1 font-heading font-semibold">Frequently Asked Questions</h1>
        </div>
      </div>
      <div className="container-custom py-section max-w-2xl">
        <div className="border-t">
          <FaqAccordion faqs={faqs} />
        </div>
      </div>
    </>
  )
}
