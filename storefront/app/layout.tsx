import './globals.css'
import type { Metadata } from 'next'
import { Lato, Inter } from 'next/font/google'
import Script from 'next/script'
import { Providers } from './providers'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import AnnouncementBar from '@/components/layout/announcement-bar'
import { AnalyticsProvider } from '@/components/analytics-provider'
import { Toaster } from 'sonner'
import { ElementPickerListener } from '@/components/element-picker-listener'
import { ErrorBoundary } from '@/components/error-boundary'
import dynamic from 'next/dynamic'
import { PLUGIN_REGISTRY } from './_generated/plugin-registry'
import { getPluginConfigs } from '@/lib/plugin-config'
import type { ComponentEntry } from '@/types/plugins'

const CookieConsent = dynamic(() => import('@/components/cookie-consent'))

const heading = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Store — Modern Commerce',
    template: '%s | Store',
  },
  description: 'Discover curated products crafted with care. A modern ecommerce experience.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const needsConfig = PLUGIN_REGISTRY.head.length > 0 || PLUGIN_REGISTRY.rootProviders.length > 0
  const pluginConfigs = needsConfig ? await getPluginConfigs() : {}

  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        {/* PostHog cross-origin iframe recording shim — records DOM via rrweb and forwards
            events to the parent window (admin dashboard) for session replay.
            Uses rrweb@2.0.0-alpha.20 (same version proven in ecomcoder production). */}
        <script dangerouslySetInnerHTML={{ __html: `
(function() {
  'use strict';
  if (window.parent === window) return;
  var origin = window.location.origin;
  function startRecording() {
    var record = window.rrweb && window.rrweb.record;
    if (!record) return;
    record({
      emit: function(event) {
        try { window.parent.postMessage({ type: 'rrweb', event: event, origin: origin, isCheckout: event.type === 2 }, '*'); } catch(e) {}
      },
      collectFonts: true,
      sampling: { scroll: 150 }
    });
  }
  var s = document.createElement('script');
  s.src = 'https://unpkg.com/rrweb@2.0.0-alpha.20/dist/rrweb.umd.min.cjs';
  s.onload = startRecording;
  s.onerror = function() {
    var f = document.createElement('script');
    f.src = 'https://cdn.jsdelivr.net/npm/rrweb@2.0.0-alpha.20/dist/rrweb.umd.min.cjs';
    f.onload = startRecording;
    document.head.appendChild(f);
  };
  document.head.appendChild(s);
})();
        `}} />
      </head>
      <body>
        <Providers pluginConfigs={pluginConfigs}>
          <ElementPickerListener />
          <AnnouncementBar />
          <Header />
          <main className="min-h-screen">
            <ErrorBoundary>
              <AnalyticsProvider>
                {children}
              </AnalyticsProvider>
            </ErrorBoundary>
          </main>
          <Footer />
          {/* bodyEnd slot — chat widgets, overlays */}
          {(PLUGIN_REGISTRY.bodyEnd as ComponentEntry[]).map(({ id, Component, propsFromConfig = {} }) => {
            if (pluginConfigs[id]?.enabled === false) return null
            const props = Object.fromEntries(
              Object.entries(propsFromConfig).map(([k, cfgKey]) => [k, pluginConfigs[id]?.[cfgKey]])
            )
            return (
              <ErrorBoundary key={id} fallback={null}>
                <Component {...props} />
              </ErrorBoundary>
            )
          })}
          <CookieConsent />
          <Toaster position="bottom-right" richColors />
        </Providers>

        {/* head slot — analytics scripts, tracking pixels */}
        {PLUGIN_REGISTRY.head
          .filter(({ id, when }) => {
            if (pluginConfigs[id]?.enabled === false) return false
            if (!when) return true
            const key = when.split('.').pop()!
            return Boolean(pluginConfigs[id]?.[key])
          })
          .map(({ id, src, strategy }) => (
            <Script key={id} src={src} strategy={strategy} />
          ))}
      </body>
    </html>
  )
}
