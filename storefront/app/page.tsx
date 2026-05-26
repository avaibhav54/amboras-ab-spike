// SPIKE VARIANT B page — bolder hero, urgency-focused copy, dark theme
import Link from 'next/link'

export default function HomePage() {
  return (
    <main>
      {/* Visible variant marker so user can confirm which one is rendering */}
      <div style={{ background: '#ff0080', color: 'white', padding: '8px 16px', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>
        🅱️ VARIANT B — different hero, different products, different about
      </div>
      <section style={{
        background: '#1a1a1a',
        color: 'white',
        padding: '140px 40px',
        textAlign: 'center',
        minHeight: '70vh',
      }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#ff0080', margin: 0 }}>
          Limited Edition · Drops Friday
        </p>
        <h1 style={{ fontSize: 88, fontWeight: 800, margin: '24px 0', letterSpacing: '-0.04em', lineHeight: 0.95 }}>
          Designed For The<br/>Way You Actually Live
        </h1>
        <p style={{ fontSize: 20, color: '#bbb', maxWidth: 580, margin: '0 auto 40px' }}>
          Real products. Real warranty. Free shipping over $50. Loved by 4,800+ customers.
        </p>
        <Link href="/products" style={{
          padding: '20px 44px', background: '#ff0080', color: 'white',
          textDecoration: 'none', fontSize: 14, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
          Browse The Drop →
        </Link>
      </section>
      <section style={{ padding: '80px 40px', maxWidth: 800, margin: '0 auto', textAlign: 'center', background: '#fafafa' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700 }}>Why customers choose us</h2>
        <p style={{ color: '#666', fontSize: 16, lineHeight: 1.7 }}>
          ⚡ Ships in 24h · 🔄 60-day returns · ⭐ 4.9/5 from 2,300+ reviews
        </p>
      </section>
    </main>
  )
}
