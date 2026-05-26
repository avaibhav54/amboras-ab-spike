'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { PLUGIN_REGISTRY } from '@/app/_generated/plugin-registry'
import type { PluginConfigs } from '@/types/plugins'

interface ProvidersProps {
  children: React.ReactNode
  pluginConfigs?: PluginConfigs
}

export function Providers({ children, pluginConfigs = {} }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        {/* rootProviders slot — null-rendering side-effect components (script loaders,
            context initializers). Plugins registered here must render null. */}
        {PLUGIN_REGISTRY.rootProviders.map(({ id, Component, propsFromConfig = {} }) => {
          if (pluginConfigs[id]?.enabled === false) return null
          const props = Object.fromEntries(
            Object.entries(propsFromConfig).map(([k, cfgKey]) => [k, pluginConfigs[id]?.[cfgKey]])
          )
          return <Component key={id} {...props} />
        })}
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
