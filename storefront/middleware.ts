// SPIKE: cross-deployment rewrite test
// Rewrites ?bucket=B to the spike-variant-b preview deployment.
// This is the load-bearing test for the entire branch-per-variant architecture.
//
// Test strategies (via ?strategy=N query param):
//   strategy=1 (default): plain rewrite, no bypass header → expect 401
//   strategy=2: rewrite with x-vercel-protection-bypass header
//   strategy=3: rewrite via stable Vercel deployment alias (set up separately)
//   strategy=4: relies on deployment protection being disabled in dashboard
//
// To capture latency we add a custom response header x-spike-latency-ms.

import { NextResponse, type NextRequest } from 'next/server'

// Variant-B preview deployment URL (the deployment we just pushed)
const VARIANT_B_URL = 'https://amboras-ab-spike-p044thxf4-avaibhav54s-projects.vercel.app'

// Optional bypass token — set via Vercel env var VERCEL_AUTOMATION_BYPASS_SECRET
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? ''

export async function middleware(req: NextRequest) {
  const { searchParams, pathname } = req.nextUrl
  const bucket = searchParams.get('bucket')
  const strategy = searchParams.get('strategy') ?? '1'

  // Pass through if not bucket=B
  if (bucket !== 'B') {
    return NextResponse.next()
  }

  const start = Date.now()
  const targetUrl = new URL(pathname + req.nextUrl.search, VARIANT_B_URL)

  let rewriteOpts: { request?: { headers: Headers } } | undefined

  if (strategy === '2' && BYPASS_TOKEN) {
    // Strategy 2: pass bypass token in request headers (Vercel reads
    // x-vercel-protection-bypass to skip SSO challenge).
    const headers = new Headers(req.headers)
    headers.set('x-vercel-protection-bypass', BYPASS_TOKEN)
    headers.set('x-vercel-set-bypass-cookie', 'true')
    rewriteOpts = { request: { headers } }
  }

  const res = NextResponse.rewrite(targetUrl, rewriteOpts)
  res.headers.set('x-spike-strategy', strategy)
  res.headers.set('x-spike-target', targetUrl.toString())
  res.headers.set('x-spike-latency-ms', String(Date.now() - start))
  return res
}

export const config = {
  matcher: '/((?!_next|api|favicon|robots).*)',
}
