'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getConsent, hasAnalyticsConsent } from '@/lib/cookie-consent'
import { initAnalytics, trackPageView, destroyAnalytics } from '@/lib/analytics'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [consentVersion, setConsentVersion] = useState<string | null>(() => getConsent()?.ts ?? null)

  useEffect(() => {
    const syncConsent = () => {
      const nextConsentVersion = getConsent()?.ts ?? null
      setConsentVersion((prev) => (prev === nextConsentVersion ? prev : nextConsentVersion))
    }

    window.addEventListener('focus', syncConsent)
    document.addEventListener('visibilitychange', syncConsent)
    window.addEventListener('storage', syncConsent)
    window.addEventListener('amboras-consent-changed', syncConsent)

    return () => {
      window.removeEventListener('focus', syncConsent)
      document.removeEventListener('visibilitychange', syncConsent)
      window.removeEventListener('storage', syncConsent)
      window.removeEventListener('amboras-consent-changed', syncConsent)
    }
  }, [])

  useEffect(() => {
    if (hasAnalyticsConsent()) {
      initAnalytics()
      return () => destroyAnalytics()
    }

    destroyAnalytics()
    return undefined
  }, [consentVersion])

  useEffect(() => {
    if (hasAnalyticsConsent()) {
      trackPageView(pathname, document.title)
    }
  }, [pathname, consentVersion])

  return <>{children}</>
}
