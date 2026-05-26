import Medusa from "@medusajs/js-sdk"

const baseConfig = {
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  debug: process.env.NODE_ENV === "development",
  globalHeaders: {
    ...(process.env.NEXT_PUBLIC_STORE_ID
      ? { "X-Store-Environment-ID": process.env.NEXT_PUBLIC_STORE_ID }
      : {}),
  },
}

/**
 * Client-side SDK — uses localStorage for JWT persistence.
 * Use ONLY in 'use client' components and hooks (use-auth, use-cart, etc.)
 *
 * Lazily initialized on first access to avoid SSR issues — Next.js loads
 * modules on the server first where localStorage doesn't exist. By deferring
 * creation to the first call (which always happens on the client for 'use client'
 * components), we guarantee localStorage is available.
 */
let _medusaClient: Medusa | null = null

export function getMedusaClient(): Medusa {
  if (!_medusaClient) {
    _medusaClient = new Medusa({
      ...baseConfig,
      auth: {
        type: "jwt",
        jwtTokenStorageMethod: "local",
        jwtTokenStorageKey: "medusa_auth_token",
      },
    })
  }
  return _medusaClient
}

/**
 * Server-side SDK — no auth storage (localStorage not available in SSR).
 * Use this in Server Components (product detail, collection pages, etc.)
 */
export const medusaServerClient = new Medusa({
  ...baseConfig,
  auth: {
    type: "jwt",
    jwtTokenStorageMethod: "memory",
  },
})
