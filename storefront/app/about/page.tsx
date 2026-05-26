// SPIKE VARIANT B about — founder narrative + stats angle
export default function AboutPage() {
  return (
    <main style={{ padding: '80px 40px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ background: '#ff0080', color: 'white', padding: '8px 16px', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', fontSize: 13, marginBottom: 40 }}>
        🅱️ VARIANT B — about page
      </div>
      <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#ff0080', margin: 0 }}>Our Story</p>
      <h1 style={{ fontSize: 56, fontWeight: 800, margin: '16px 0 32px', letterSpacing: '-0.03em', lineHeight: 1 }}>
        Built by people who actually use the products
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, margin: '40px 0' }}>
        <div><div style={{ fontSize: 36, fontWeight: 800, color: '#ff0080' }}>4,800+</div><div style={{ color: '#666', fontSize: 13 }}>Happy customers</div></div>
        <div><div style={{ fontSize: 36, fontWeight: 800, color: '#ff0080' }}>4.9★</div><div style={{ color: '#666', fontSize: 13 }}>Average rating</div></div>
        <div><div style={{ fontSize: 36, fontWeight: 800, color: '#ff0080' }}>24h</div><div style={{ color: '#666', fontSize: 13 }}>Ship time</div></div>
      </div>
      <p style={{ fontSize: 18, color: '#444', lineHeight: 1.7 }}>
        Started in a garage in 2024. Now we ship to 47 countries. Every product is tested in our own homes first — if we wouldn&apos;t buy it, we don&apos;t sell it.
      </p>
    </main>
  )
}
