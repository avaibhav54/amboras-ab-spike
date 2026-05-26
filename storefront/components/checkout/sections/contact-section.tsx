'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { Section } from '@/components/checkout/section'
import { FloatingField } from '@/components/checkout/floating-field'
import type { CheckoutSettings } from '@/lib/checkout-config'

export interface ContactFormValues {
  email: string
}

interface ContactSectionProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  /** Kept for backwards-compat; no longer used (FloatingField owns its own styling). */
  inputCls?: (hasError: boolean) => string
  collapsed: boolean
  onEdit: () => void
  emailValue: string
  isLoggedIn: boolean
  checkoutSettings?: CheckoutSettings
  marketingOptIn: boolean
  setMarketingOptIn: (v: boolean) => void
}

export function ContactSection({
  register,
  errors,
  collapsed: collapsedProp,
  onEdit,
  emailValue,
  isLoggedIn,
  checkoutSettings,
  marketingOptIn,
  setMarketingOptIn,
}: ContactSectionProps) {
  const marketingEnabled =
    !!checkoutSettings?.marketing_opt_in?.enabled &&
    checkoutSettings.marketing_opt_in.where !== 'signin'

  // Track focus on the section so we never auto-collapse while the buyer is
  // mid-typing. Parent's `collapsed` is "fields validate"; the section stays
  // expanded as long as focus is anywhere within it. We use rAF +
  // document.activeElement (not relatedTarget) because relatedTarget can be
  // null when focus moves to the body or to a non-focusable parent — and we
  // don't want to collapse in those transient cases.
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const handleFocus = () => setIsFocusWithin(true)
  const handleBlur = () => {
    requestAnimationFrame(() => {
      const root = wrapperRef.current
      if (root && !root.contains(document.activeElement)) {
        setIsFocusWithin(false)
      }
    })
  }
  const collapsed = collapsedProp && !isFocusWithin

  const signInLink = !isLoggedIn ? (
    <Link
      href="/auth/login?redirect=/checkout"
      className="text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
    >
      Sign in
    </Link>
  ) : null

  return (
    <div ref={wrapperRef} onFocus={handleFocus} onBlur={handleBlur}>
    <Section
      title="Contact"
      collapsed={collapsed}
      onChange={onEdit}
      headerAction={signInLink}
      summary={<span className="text-foreground">{emailValue}</span>}
    >
      <FloatingField
        type="email"
        label="Email"
        autoComplete="email"
        error={errors.email?.message ? String(errors.email.message) : undefined}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address',
          },
        })}
      />

      {marketingEnabled && (
        <label className="flex items-start gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-[hsl(var(--accent))] rounded"
          />
          <span className="text-sm text-foreground">
            Email me with news and offers
          </span>
        </label>
      )}
    </Section>
    </div>
  )
}
