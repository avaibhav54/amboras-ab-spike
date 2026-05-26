// SPIKE layout — no Medusa providers, just a basic shell with cross-page nav
import './globals.css'

export const metadata = {
  title: 'Amboras A/B Spike',
  description: 'Spike validating branch-per-variant rewrite',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a' }}>
        <header style={{
          borderBottom: '1px solid #e5e5e5',
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white',
        }}>
          <a href="/" style={{ fontSize: 18, fontWeight: 700, textDecoration: 'none', color: '#1a1a1a', letterSpacing: '0.15em' }}>
            AMBORAS
          </a>
          <nav style={{ display: 'flex', gap: 32 }}>
            <a href="/" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Home</a>
            <a href="/products" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Products</a>
            <a href="/about" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>About</a>
          </nav>
        </header>
        {children}
        <footer style={{ padding: '60px 40px', textAlign: 'center', color: '#888', fontSize: 13, borderTop: '1px solid #e5e5e5' }}>
          Spike build · Reload or open incognito to see if you stay on the same variant across pages
        </footer>
      </body>
    </html>
  )
}
