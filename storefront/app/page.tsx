// SPIKE control page — variant A (the baseline)
import Link from 'next/link'

export default function HomePage() {
  return (
    <main>
      <section style={{
        background: '#f8f6f1',
        padding: '120px 40px',
        textAlign: 'center',
        minHeight: '70vh',
      }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#888', margin: 0 }}>
          New Collection
        </p>
        <h1 style={{ fontSize: 72, fontWeight: 600, margin: '24px 0', letterSpacing: '-0.02em', lineHeight: 1 }}>
          Elevate Your Everyday
        </h1>
        <p style={{ fontSize: 18, color: '#666', maxWidth: 540, margin: '0 auto 32px' }}>
          Thoughtfully designed products that bring beauty and function to your daily rituals.
        </p>
        <Link href="/products" style={{
          padding: '16px 36px', background: '#1a1a1a', color: 'white',
          textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
          Shop Now →
        </Link>
      </section>
      <section style={{ padding: '80px 40px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 500 }}>Our Philosophy</h2>
        <p style={{ color: '#666', fontSize: 16, lineHeight: 1.7 }}>
          We believe in fewer, better things — pieces that last and bring joy to everyday moments.
        </p>
      </section>
    </main>
  )
}
