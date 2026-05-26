'use client'

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Shopify-style boxed input with a floating label.
 *
 * Empty + unfocused → placeholder-style label centered inside the box.
 * Focused or filled → label shrinks and floats to the top-left of the box.
 *
 * Driven entirely by the CSS `:placeholder-shown` pseudo-class — there is no
 * JS state; the input owns its own visual state via its placeholder being
 * present or absent. The `placeholder=" "` (a single space) is required so
 * the input renders the placeholder when empty (label floats up via the
 * `peer-not-placeholder-shown` variant).
 */
interface FloatingFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string
  error?: string
  /** Optional right-aligned content inside the field (e.g. search icon). */
  trailing?: ReactNode
}

export const FloatingField = forwardRef<HTMLInputElement, FloatingFieldProps>(
  function FloatingField({ label, error, trailing, className, id, ...rest }, ref) {
    const reactId = useId()
    const inputId = id ?? reactId
    const hasError = !!error
    return (
      <div>
        <div
          className={
            'relative rounded-md border bg-background transition-colors ' +
            (hasError
              ? 'border-destructive focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/15'
              : 'border-border hover:border-foreground/40 focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground/10')
          }
        >
          <input
            {...rest}
            id={inputId}
            ref={ref}
            placeholder=" "
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            className={
              'peer block w-full h-14 bg-transparent text-sm text-foreground px-3 pt-5 pb-1 ' +
              'placeholder-transparent focus:outline-none ' +
              (trailing ? 'pr-10 ' : '') +
              (className ?? '')
            }
          />
          <label
            htmlFor={inputId}
            className={
              'pointer-events-none absolute left-3 transition-all ' +
              'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm ' +
              'peer-focus:top-1.5 peer-focus:-translate-y-0 peer-focus:text-xs ' +
              'top-1.5 -translate-y-0 text-xs ' +
              (hasError
                ? 'text-destructive'
                : 'text-muted-foreground peer-focus:text-foreground')
            }
          >
            {label}
          </label>
          {trailing && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {trailing}
            </div>
          )}
        </div>
        {hasError && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-1 text-xs text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    )
  },
)

interface FloatingSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label: string
  error?: string
  children: ReactNode
}

/**
 * Shopify-style boxed `<select>` with an always-visible small label at the
 * top. Selects can't fake "placeholder-shown" the way inputs can, so the
 * label is permanently at the top — matching Shopify's Country/Region and
 * State controls in the reference screenshot.
 */
export const FloatingSelect = forwardRef<HTMLSelectElement, FloatingSelectProps>(
  function FloatingSelect(
    { label, error, className, id, children, ...rest },
    ref,
  ) {
    const reactId = useId()
    const selectId = id ?? reactId
    const hasError = !!error
    return (
      <div>
        <div
          className={
            'relative h-14 rounded-md border bg-background transition-colors ' +
            (hasError
              ? 'border-destructive focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/15'
              : 'border-border hover:border-foreground/40 focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground/10')
          }
        >
          <label
            htmlFor={selectId}
            className={
              'pointer-events-none absolute left-3 top-1.5 text-xs ' +
              (hasError ? 'text-destructive' : 'text-muted-foreground')
            }
          >
            {label}
          </label>
          <select
            {...rest}
            id={selectId}
            ref={ref}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? `${selectId}-error` : undefined}
            className={
              'absolute inset-x-0 bottom-1 top-5 w-full appearance-none bg-transparent ' +
              'px-3 pr-9 text-sm text-foreground focus:outline-none cursor-pointer ' +
              (className ?? '')
            }
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden
          />
        </div>
        {hasError && (
          <p
            id={`${selectId}-error`}
            role="alert"
            className="mt-1 text-xs text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    )
  },
)
