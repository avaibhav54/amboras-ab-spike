const CONSENT_COOKIE = 'amboras_consent'
const CONSENT_MAX_AGE = 31536000 // 1 year in seconds

interface ConsentState {
  analytics: boolean
  ts: string
}

export function getConsent(): ConsentState | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie
  const match = cookies
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`))

  if (!match) return null

  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')))
  } catch {
    return null
  }
}

export function hasAnalyticsConsent(): boolean {
  const consent = getConsent()
  return consent !== null && consent.analytics === true
}

function dispatchConsentChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('amboras-consent-changed'))
}

export function setConsent(analytics: boolean): void {
  const value = JSON.stringify({
    analytics,
    ts: new Date().toISOString(),
  })

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''

  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; path=/; SameSite=Lax; max-age=${CONSENT_MAX_AGE}${secure}`
  dispatchConsentChanged()
}

export function clearConsent(): void {
  document.cookie = `${CONSENT_COOKIE}=; path=/; max-age=0`
  dispatchConsentChanged()
}
