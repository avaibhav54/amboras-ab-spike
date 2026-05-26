'use client'

import { ReactNode } from 'react'
import { Check } from 'lucide-react'

interface SectionProps {
  title: string
  collapsed?: boolean
  summary?: ReactNode
  onChange?: () => void
  /** Optional right-of-title content for the expanded state (e.g. "Sign in" link). */
  headerAction?: ReactNode
  className?: string
  children: ReactNode
}

export function Section({
  title,
  collapsed = false,
  summary,
  onChange,
  headerAction,
  className = '',
  children,
}: SectionProps) {
  return (
    <section
      className={`py-6 first:pt-0 ${className}`}
      aria-label={title}
    >
      <header className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold text-foreground">
          {collapsed && (
            <Check
              className="h-4 w-4 text-emerald-600 dark:text-emerald-500"
              aria-hidden
            />
          )}
          {title}
        </h2>
        {collapsed && onChange ? (
          <button
            type="button"
            onClick={onChange}
            aria-label={`Change ${title.toLowerCase()}`}
            className="text-sm text-[hsl(var(--accent))] hover:underline underline-offset-4 transition-colors"
          >
            Change
          </button>
        ) : (
          headerAction && !collapsed && (
            <div className="text-sm">{headerAction}</div>
          )
        )}
      </header>

      {collapsed && summary ? (
        <div className="text-sm text-muted-foreground">{summary}</div>
      ) : (
        children
      )}
    </section>
  )
}
