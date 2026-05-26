// SPIKE control products page — variant A
export default function ProductsPage() {
  const products = [
    { name: 'Linen Tote', price: '$45' },
    { name: 'Ceramic Mug', price: '$28' },
    { name: 'Brass Candleholder', price: '$72' },
    { name: 'Cashmere Throw', price: '$185' },
  ]
  return (
    <main style={{ padding: '60px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 48, fontWeight: 600, margin: '0 0 40px' }}>All Products</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
        {products.map(p => (
          <div key={p.name} style={{ padding: 24, border: '1px solid #e5e5e5', background: 'white' }}>
            <div style={{ height: 200, background: '#f8f6f1', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 4px' }}>{p.name}</h3>
            <p style={{ color: '#666', fontSize: 14, margin: 0 }}>{p.price}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
