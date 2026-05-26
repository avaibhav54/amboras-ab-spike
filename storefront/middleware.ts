// SPIKE middleware — cookie-based A/B bucketing
// Real A/B testing: every request reads a sticky cookie, hashes it, picks a variant.
// No ?bucket= query param — the cookie persists across all pages and return visits.

import { NextResponse, type NextRequest } from 'next/server'

const VARIANT_B_URL = 'https://amboras-ab-spike-p044thxf4-avaibhav54s-projects.vercel.app'

const COOKIE = 'amb_vid'
const EXPERIMENT_ID = 'spike-001'

// Deterministic hash → bucket. djb2 — small, fast, no deps. In production we'd
// use MurmurHash3 (Optimizely/GrowthBook/Statsig standard) for better distribution.
function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return h >>> 0
}

function pickBucket(vid: string): 'A' | 'B' {
  return hash(`${vid}:${EXPERIMENT_ID}`) % 2 === 0 ? 'A' : 'B'
}

export async function middleware(req: NextRequest) {
  // Skip Next internals + static assets
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') ||
      pathname === '/favicon.ico' || pathname === '/robots.txt') {
    return NextResponse.next()
  }

  // Read or mint visitor ID
  let vid = req.cookies.get(COOKIE)?.value
  const isNew = !vid
  if (!vid) {
    vid = crypto.randomUUID()
  }

  const bucket = pickBucket(vid)

  // Build response — either pass-through (variant A) or rewrite (variant B)
  let res: NextResponse
  if (bucket === 'B') {
    const target = new URL(req.nextUrl.pathname + req.nextUrl.search, VARIANT_B_URL)
    res = NextResponse.rewrite(target)
  } else {
    res = NextResponse.next()
  }

  // Always set cookie on first visit (host-only — no Domain attr = locked to this hostname)
  if (isNew) {
    res.cookies.set(COOKIE, vid, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
  }

  // Diagnostic headers so you can curl -I and see what middleware decided
  res.headers.set('x-spike-vid', vid)
  res.headers.set('x-spike-bucket', bucket)
  res.headers.set('x-spike-new-visitor', isNew ? 'yes' : 'no')
  return res
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon|robots).*)',
}
