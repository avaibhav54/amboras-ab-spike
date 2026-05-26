// SPIKE middleware — cookie-based A/B bucketing with self-skip guard
//
// Self-skip: this middleware runs on EVERY deployment of the project (prod + previews).
// We must NOT bucket+rewrite when we ARE the variant deployment, or we recurse / serve
// stale content. We detect by comparing the request host to the variant deployment's host.

import { NextResponse, type NextRequest } from 'next/server'

const VARIANT_B_URL = 'https://amboras-ab-spike-lsawx81nv-avaibhav54s-projects.vercel.app'
const VARIANT_B_HOST = new URL(VARIANT_B_URL).host

const COOKIE = 'amb_vid'
const EXPERIMENT_ID = 'spike-001'

function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return h >>> 0
}

function pickBucket(vid: string): 'A' | 'B' {
  return hash(`${vid}:${EXPERIMENT_ID}`) % 2 === 0 ? 'A' : 'B'
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') ||
      pathname === '/favicon.ico' || pathname === '/robots.txt') {
    return NextResponse.next()
  }

  // SELF-SKIP: this middleware ships with every deployment of the project.
  // On variant (Preview) deployments, just serve own content — no bucketing,
  // no rewriting. Only the Production deployment of main runs the experiment.
  const isPreview = process.env.VERCEL_ENV === 'preview'
  const host = req.headers.get('host') ?? ''
  if (isPreview || host === VARIANT_B_HOST) {
    const res = NextResponse.next()
    res.headers.set('x-spike-self-skip', isPreview ? 'preview-env' : 'host-match')
    return res
  }

  let vid = req.cookies.get(COOKIE)?.value
  const isNew = !vid
  if (!vid) vid = crypto.randomUUID()
  const bucket = pickBucket(vid)

  let res: NextResponse
  if (bucket === 'B') {
    const target = new URL(req.nextUrl.pathname + req.nextUrl.search, VARIANT_B_URL)
    res = NextResponse.rewrite(target)
  } else {
    res = NextResponse.next()
  }

  if (isNew) {
    res.cookies.set(COOKIE, vid, {
      httpOnly: false, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/',
    })
  }

  res.headers.set('x-spike-vid', vid)
  res.headers.set('x-spike-bucket', bucket)
  res.headers.set('x-spike-new-visitor', isNew ? 'yes' : 'no')
  res.headers.set('x-spike-host', host)

  // CRITICAL: don't let Vercel CDN cache this response. If we did, the
  // first visitor's Set-Cookie + variant content would be served to every
  // subsequent visitor — all of them would converge on the same bucket.
  // Variant deployment's content is still cached at the variant edge, so
  // we only lose the prod-deployment cache layer (acceptable for v0).
  //
  // Production optimization: shard the cache by variant (e.g. cache key
  // includes the cookie value, or precompute pattern from Vercel Flags SDK).
  res.headers.set('cache-control', 'private, no-store, max-age=0')
  return res
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon|robots).*)',
}
