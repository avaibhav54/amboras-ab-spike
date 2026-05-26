// SPIKE VARIANT B products — same SKUs, different copy + sale framing
export default function ProductsPage() {
  const products = [
    { name: 'Linen Tote — Best Seller', price: '$45', tag: '★ 1,200 reviews' },
    { name: 'Ceramic Mug Set', price: '$28', tag: '20% off this week' },
    { name: 'Brass Candleholder', price: '$72', tag: 'Limited Edition' },
    { name: 'Cashmere Throw', price: '$185', tag: 'Free shipping' },
  ]
  return (
    <main style={{ padding: '60px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ background: '#ff0080', color: 'white', padding: '8px 16px', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', fontSize: 13, marginBottom: 40 }}>
        🅱️ VARIANT B — products page
      </div>
      <h1 style={{ fontSize: 56, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em' }}>Shop The Drop</h1>
      <p style={{ fontSize: 16, color: '#666', margin: '0 0 40px' }}>Free shipping over $50 · 60-day returns · 4,800+ happy customers</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
        {products.map(p => (
          <div key={p.name} style={{ padding: 24, border: '2px solid #1a1a1a', background: 'white' }}>
            <div style={{ height: 200, background: '#1a1a1a', marginBottom: 16, position: 'relative' }}>
              <span style={{ position: 'absolute', top: 12, left: 12, background: '#ff0080', color: 'white', padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>{p.tag}</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>{p.name}</h3>
            <p style={{ color: '#1a1a1a', fontSize: 18, fontWeight: 800, margin: 0 }}>{p.price}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
