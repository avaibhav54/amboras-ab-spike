'use client'

import { useMemo, useRef, useState } from 'react'
import type {
  UseFormRegister,
  UseFormSetValue,
  FieldErrors,
} from 'react-hook-form'
import { HelpCircle, Search } from 'lucide-react'
import { Section } from '@/components/checkout/section'
import {
  FloatingField,
  FloatingSelect,
} from '@/components/checkout/floating-field'
import type { CheckoutSettings } from '@/lib/checkout-config'
import {
  getSubdivisions,
  findSubdivision,
} from '@/lib/checkout/countries-states'
import {
  getPostalCodeRule,
  hasNoPostalCode,
} from '@/lib/checkout/postal-codes'
import { getRegionRule } from '@/lib/checkout/region-rules'
import {
  usePlacesAutocomplete,
  type ResolvedAddress,
} from '@/lib/checkout/google-places'

export interface CountryOption {
  code: string
  name: string
  regionId: string
}

export interface AddressValues {
  first_name: string
  last_name: string
  company: string
  address_1: string
  address_2: string
  city: string
  postal_code: string
  province: string
  country_code: string
  phone: string
}

interface AddressSectionProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  setValue: UseFormSetValue<any>
  /** Legacy prop kept for backwards-compat — FloatingField owns its own styling. */
  inputCls?: (hasError: boolean) => string

  /**
   * 'shipping' (default) → full Shopify delivery form: Places autocomplete,
   * save-info checkbox, auto-collapsing with Change action.
   * 'billing' → the inline form shown under the Payment section when the
   * buyer toggles "use a different billing address". Different title, no
   * save-info, no Places, never collapses.
   */
  mode?: 'shipping' | 'billing'

  collapsed?: boolean
  onEdit?: () => void

  address: AddressValues

  countryOptions: CountryOption[]
  onCountryChange: (countryCode: string) => void

  checkoutSettings?: CheckoutSettings
  saveInfo?: boolean
  setSaveInfo?: (v: boolean) => void
  isLoggedIn: boolean
  isUpdating?: boolean
}

export function AddressSection({
  register,
  errors,
  setValue,
  mode = 'shipping',
  collapsed: collapsedProp = false,
  onEdit,
  address,
  countryOptions,
  onCountryChange,
  checkoutSettings,
  saveInfo,
  setSaveInfo,
  isLoggedIn,
  isUpdating,
}: AddressSectionProps) {
  const isBilling = mode === 'billing'
  const countryCode = address.country_code
  const subdivisions = useMemo(() => getSubdivisions(countryCode), [countryCode])

  // Focus-within tracking so we never auto-collapse while the buyer is
  // mid-typing in any address field. We use rAF + document.activeElement
  // (not relatedTarget) because relatedTarget can be null when focus moves
  // to body / non-focusable parent, and we don't want to collapse in those
  // transient cases.
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

  // Shopify renders the apartment field inline by default (not behind a
  // toggle) — we honour the checkoutSettings 'hidden' switch but otherwise
  // always show the input.
  const apartmentVisibility = checkoutSettings?.address_line_2 ?? 'optional'
  const apartmentForced = apartmentVisibility === 'required'

  // Places autocomplete: bind to address_1, push resolved fields back into the form.
  const handlePlaceResolve = (resolved: ResolvedAddress) => {
    if (resolved.address_1) {
      setValue('address_1', resolved.address_1, {
        shouldValidate: true,
        shouldTouch: true,
      })
    }
    if (resolved.city) {
      setValue('city', resolved.city, {
        shouldValidate: true,
        shouldTouch: true,
      })
    }
    if (resolved.postal_code) {
      setValue('postal_code', resolved.postal_code, {
        shouldValidate: true,
        shouldTouch: true,
      })
    }
    if (resolved.country_code && resolved.country_code !== countryCode) {
      setValue('country_code', resolved.country_code, { shouldValidate: false })
      onCountryChange(resolved.country_code)
    }
    if (resolved.province_code || resolved.province_name) {
      const sub =
        findSubdivision(resolved.country_code, resolved.province_code) ||
        findSubdivision(resolved.country_code, resolved.province_name)
      const valueToSet = sub?.code ?? resolved.province_code ?? ''
      if (valueToSet) {
        setValue('province', valueToSet, {
          shouldValidate: true,
          shouldTouch: true,
        })
      }
    }
  }

  // Places autocomplete is only meaningful on the shipping form. For the
  // inline billing form (small footprint, secondary path), skip it.
  const { inputRef: placesRef } = usePlacesAutocomplete({
    countryCode: countryCode || undefined,
    onResolve: handlePlaceResolve,
    enabled: !isBilling,
  })

  // Merge react-hook-form's ref with the Places ref so both control the same input.
  const addressRegister = register('address_1', {
    required: 'Address is required',
  })

  const summary = (
    <div className="space-y-0.5">
      <div>
        {[address.first_name, address.last_name].filter(Boolean).join(' ')}
      </div>
      <div>
        {[address.address_1, address.address_2].filter(Boolean).join(', ')}
      </div>
      <div>
        {[address.city, address.province, address.postal_code]
          .filter(Boolean)
          .join(', ')}
      </div>
      <div className="text-xs">
        {countryOptions.find((c) => c.code === countryCode)?.name || countryCode}
        {address.phone ? ` · ${address.phone}` : ''}
      </div>
    </div>
  )

  const fullName = checkoutSettings?.full_name ?? 'full'
  const companyVisibility = checkoutSettings?.company_name ?? 'hidden'
  const phoneReq = checkoutSettings?.phone ?? 'optional'

  // Country-specific postal rules: localized label, validation regex, example.
  // Countries with no postal system (UAE, HK, …) hide the field entirely.
  // `requirement: 'optional'` (e.g. Ireland) keeps the field visible but
  // skips the required-validator so empty submission is accepted.
  const postalRule = getPostalCodeRule(countryCode)
  const postalLabel = postalRule.label ?? 'Postal code'
  const postalHidden = hasNoPostalCode(countryCode)
  const postalRequired = postalRule.requirement !== 'optional'

  // Country-specific region (state / province / prefecture / …) rules.
  // Hidden for DE/FR/NL/BE/etc.; required vs optional drives validation.
  const regionRule = getRegionRule(countryCode)
  const regionHidden = regionRule.requirement === 'hidden'
  const regionRequired = regionRule.requirement === 'required'
  const regionLabel = regionRule.label || 'State / Province'

  // City / region / postal grid columns: count what's visible so the grid
  // stays balanced (Singapore = just City; Germany = City + Postal; etc.).
  const gridVisible = 1 + (regionHidden ? 0 : 1) + (postalHidden ? 0 : 1)
  const gridColsClass =
    gridVisible === 3
      ? 'sm:grid-cols-3'
      : gridVisible === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-1'

  // Mexico-specific: address_2 is the colonia (neighborhood), which is
  // required for delivery. Override label + requirement for MX.
  const isMexico = countryCode?.toUpperCase() === 'MX'
  const apartmentLabel = isMexico
    ? 'Colonia (neighborhood)'
    : apartmentForced
      ? 'Apartment, suite, etc.'
      : 'Apartment, suite, etc. (optional)'
  const apartmentRequired = isMexico || apartmentForced

  const countryRegister = register('country_code', {
    required: 'Country is required',
  })

  return (
    <div ref={wrapperRef} onFocus={handleFocus} onBlur={handleBlur}>
    <Section
      title={isBilling ? 'Billing address' : 'Delivery'}
      collapsed={isBilling ? false : collapsed}
      onChange={onEdit}
      summary={summary}
    >
      <div className="space-y-3">
        {/* Country — full width, FIRST */}
        <FloatingSelect
          label="Country/Region"
          error={
            errors.country_code?.message
              ? String(errors.country_code.message)
              : undefined
          }
          {...countryRegister}
          value={countryCode || ''}
          onChange={(e) => {
            const code = e.target.value
            countryRegister.onChange(e)
            setValue('country_code', code, { shouldValidate: true })
            // Postal codes are country-specific (US ZIPs are invalid for UK,
            // and UAE has none at all). Province codes are ISO 3166-2 — also
            // not portable across countries. Clear both so a stale value from
            // the prior country doesn't get submitted or block the form.
            setValue('province', '', { shouldValidate: false })
            setValue('postal_code', '', { shouldValidate: false })
            onCountryChange(code)
          }}
          disabled={isUpdating}
        >
          <option value="" disabled>
            Select a country
          </option>
          {countryOptions.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </FloatingSelect>

        {/* First / Last name */}
        <div
          className={
            fullName === 'last_only'
              ? ''
              : 'grid grid-cols-1 sm:grid-cols-2 gap-3'
          }
        >
          {fullName === 'full' && (
            <FloatingField
              type="text"
              label="First name"
              autoComplete="given-name"
              error={
                errors.first_name?.message
                  ? String(errors.first_name.message)
                  : undefined
              }
              {...register('first_name', {
                validate: (val) =>
                  fullName === 'full' && !val?.trim()
                    ? 'First name is required'
                    : true,
              })}
            />
          )}
          <FloatingField
            type="text"
            label="Last name"
            autoComplete="family-name"
            error={
              errors.last_name?.message
                ? String(errors.last_name.message)
                : undefined
            }
            {...register('last_name', { required: 'Last name is required' })}
          />
        </div>

        {/* Company (optional, gated) */}
        {companyVisibility === 'optional' && (
          <FloatingField
            type="text"
            label="Company (optional)"
            autoComplete="organization"
            {...register('company')}
          />
        )}

        {/* Address line 1 — Places autocomplete binds here */}
        <FloatingField
          type="text"
          label="Address"
          autoComplete="address-line1"
          trailing={!isBilling ? <Search className="h-4 w-4" aria-hidden /> : undefined}
          error={
            errors.address_1?.message
              ? String(errors.address_1.message)
              : undefined
          }
          {...addressRegister}
          ref={(el) => {
            addressRegister.ref(el)
            placesRef.current = el
          }}
        />

        {/* Apartment / colonia — always-visible (Shopify default). For Mexico
            this field becomes the colonia (neighborhood) and is required —
            we override checkoutSettings.address_line_2='hidden' for MX
            because the colonia is needed for delivery, not a power-user
            convenience like a US apartment number. */}
        {(apartmentVisibility !== 'hidden' || isMexico) && (
          <FloatingField
            type="text"
            label={apartmentLabel}
            autoComplete="address-line2"
            error={
              errors.address_2?.message
                ? String(errors.address_2.message)
                : undefined
            }
            {...register('address_2', {
              validate: (val) =>
                apartmentRequired && !val?.trim()
                  ? isMexico
                    ? 'Colonia is required'
                    : 'Apartment/suite is required'
                  : true,
            })}
          />
        )}

        {/* City | Region | Postal — column count depends on which fields are
            visible for this country (Germany hides region; UAE hides postal;
            Singapore hides both). */}
        <div className={`grid grid-cols-1 gap-3 ${gridColsClass}`}>
          <FloatingField
            type="text"
            label="City"
            autoComplete="address-level2"
            error={errors.city?.message ? String(errors.city.message) : undefined}
            {...register('city', { required: 'City is required' })}
          />

          {!regionHidden &&
            (subdivisions ? (
              <FloatingSelect
                label={regionLabel}
                error={
                  errors.province?.message
                    ? String(errors.province.message)
                    : undefined
                }
                {...register('province', {
                  validate: (val) =>
                    regionRequired && !val?.trim()
                      ? `${regionLabel} is required`
                      : true,
                })}
                value={address.province || ''}
                onChange={(e) =>
                  setValue('province', e.target.value, {
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
              >
                <option value="" disabled>
                  Select {regionLabel.toLowerCase()}
                </option>
                {subdivisions.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </FloatingSelect>
            ) : (
              <FloatingField
                type="text"
                label={
                  regionRequired ? regionLabel : `${regionLabel} (optional)`
                }
                autoComplete="address-level1"
                error={
                  errors.province?.message
                    ? String(errors.province.message)
                    : undefined
                }
                {...register('province', {
                  validate: (val) =>
                    regionRequired && !val?.trim()
                      ? `${regionLabel} is required`
                      : true,
                })}
              />
            ))}

          {!postalHidden && (
            <FloatingField
              type="text"
              label={postalRequired ? postalLabel : `${postalLabel} (optional)`}
              autoComplete="postal-code"
              error={
                errors.postal_code?.message
                  ? String(errors.postal_code.message)
                  : undefined
              }
              {...register('postal_code', {
                required: postalRequired
                  ? `${postalLabel} is required`
                  : false,
                pattern: postalRule.pattern
                  ? {
                      value: postalRule.pattern,
                      message: `Please enter a valid ${postalLabel.toLowerCase()}${
                        postalRule.example ? ` (e.g. ${postalRule.example})` : ''
                      }`,
                    }
                  : undefined,
              })}
            />
          )}
        </div>

        {/* Phone — full width, with help tooltip (Shopify pattern) */}
        <FloatingField
          type="tel"
          label={phoneReq === 'required' ? 'Phone' : 'Phone (optional)'}
          autoComplete="tel"
          trailing={
            <span
              title="In case we need to contact you about your order"
              className="pointer-events-auto cursor-help"
            >
              <HelpCircle className="h-4 w-4" aria-hidden />
            </span>
          }
          error={errors.phone?.message ? String(errors.phone.message) : undefined}
          {...register('phone', {
            validate: (val) => {
              if (phoneReq === 'required' && !val?.trim()) {
                return 'Phone is required'
              }
              if (val?.trim() && !/^[\d\s+\-()]{6,20}$/.test(val)) {
                return 'Please enter a valid phone number'
              }
              return true
            },
          })}
        />
      </div>

      {/* Save info / create account — guests only; billing form skips it. */}
      {!isBilling && !isLoggedIn && setSaveInfo && (
        <label className="flex items-start gap-2 mt-5 cursor-pointer">
          <input
            type="checkbox"
            checked={!!saveInfo}
            onChange={(e) => setSaveInfo(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-[hsl(var(--accent))] rounded"
          />
          <span className="text-sm text-foreground">
            Save this information for next time
          </span>
        </label>
      )}
    </Section>
    </div>
  )
}
