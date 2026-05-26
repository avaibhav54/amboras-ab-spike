import type { StorePolicies } from '@/hooks/use-policies'

export async function getPolicies(): Promise<StorePolicies | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
    const response = await fetch(`${baseUrl}/store/policies`, {
      headers: {
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        'X-Store-Environment-ID': process.env.NEXT_PUBLIC_STORE_ID || '',
      },
      next: { revalidate: 86400 }, // 24 hours
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.policies || null
  } catch {
    return null
  }
}
