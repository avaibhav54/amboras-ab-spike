'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Google Places Autocomplete loader + binding hook for the checkout address
 * input. Lazy-loads the Maps JS SDK on first focus, binds the legacy
 * `Autocomplete` widget to the input, and resolves a normalized address when
 * the buyer picks a prediction.
 *
 * No-ops silently when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing — the
 * address input still works as a plain text field. We deliberately avoid the
 * newer PlaceAutocompleteElement: the legacy widget is far simpler to bind
 * to react-hook-form state and to restrict by country.
 */

declare global {
  interface Window {
    google?: {
      maps: GoogleMaps
    }
    __amborasPlacesLoading?: Promise<void>
  }
}

interface GoogleMaps {
  places: {
    Autocomplete: new (
      input: HTMLInputElement,
      opts: AutocompleteOptions,
    ) => GoogleAutocomplete
  }
  event: {
    clearInstanceListeners: (instance: unknown) => void
  }
}

interface AutocompleteOptions {
  types?: string[]
  componentRestrictions?: { country?: string | string[] }
  fields?: string[]
}

interface GoogleAutocomplete {
  addListener: (event: string, cb: () => void) => void
  getPlace: () => GooglePlaceResult
  setComponentRestrictions: (opts: { country?: string | string[] }) => void
}

interface GooglePlaceResult {
  address_components?: GoogleAddressComponent[]
  formatted_address?: string
}

interface GoogleAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

/**
 * Normalized address shape that we hand back to the form once a buyer picks
 * a Places prediction. Any field can be undefined if Google didn't return it
 * for that prediction (e.g. PO boxes don't have a street number).
 */
export interface ResolvedAddress {
  address_1?: string
  city?: string
  postal_code?: string
  province_code?: string
  province_name?: string
  country_code?: string
}

const SCRIPT_ID = 'amboras-google-places-script'

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || undefined
}

function isLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.google?.maps?.places
}

/**
 * Singleton script loader. Returns a promise that resolves once the Maps JS
 * SDK is on the page, so multiple components calling load() in the same
 * session share the same script tag.
 */
function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (isLoaded()) return Promise.resolve()
  if (window.__amborasPlacesLoading) return window.__amborasPlacesLoading

  const apiKey = getApiKey()
  if (!apiKey) return Promise.resolve()

  window.__amborasPlacesLoading = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      // Another tab/instance is already loading it
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Maps load error')))
      return
    }
    const s = document.createElement('script')
    s.id = SCRIPT_ID
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => {
      window.__amborasPlacesLoading = undefined
      reject(new Error('Maps load error'))
    }
    document.head.appendChild(s)
  })
  return window.__amborasPlacesLoading
}

function parsePlace(place: GooglePlaceResult): ResolvedAddress {
  const get = (type: string, short = false): string | undefined => {
    const c = place.address_components?.find((c) => c.types.includes(type))
    if (!c) return undefined
    return short ? c.short_name : c.long_name
  }

  const streetNumber = get('street_number')
  const route = get('route')
  const address_1 = [streetNumber, route].filter(Boolean).join(' ') || undefined

  const city =
    get('locality') ||
    get('postal_town') ||
    get('sublocality_level_1') ||
    get('administrative_area_level_2')

  return {
    address_1,
    city,
    postal_code: get('postal_code'),
    province_code: get('administrative_area_level_1', true),
    province_name: get('administrative_area_level_1'),
    country_code: get('country', true)?.toUpperCase(),
  }
}

interface UsePlacesAutocompleteOptions {
  /** ISO 3166-1 alpha-2 country code(s) to restrict predictions to. */
  countryCode?: string | string[]
  /** Fires when the buyer picks a prediction. */
  onResolve: (address: ResolvedAddress) => void
  /** If false, skip binding entirely (e.g. when key is missing). */
  enabled?: boolean
}

/**
 * Attach to an address input to enable Places autocomplete. The hook returns
 * a ref + a `ready` flag so the consumer can show a subtle indicator (or
 * fall back) if Places isn't available.
 */
export function usePlacesAutocomplete({
  countryCode,
  onResolve,
  enabled = true,
}: UsePlacesAutocompleteOptions) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null)
  const onResolveRef = useRef(onResolve)
  const [ready, setReady] = useState(false)

  // Keep latest callback without re-binding
  useEffect(() => {
    onResolveRef.current = onResolve
  }, [onResolve])

  // Bind the Autocomplete widget once the input mounts + the SDK is loaded.
  useEffect(() => {
    if (!enabled) return
    if (!inputRef.current) return
    if (!getApiKey()) return // silent no-op

    let cancelled = false
    const bind = async () => {
      try {
        await loadGoogleMaps()
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return

        const widget = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['address_components', 'formatted_address'],
          componentRestrictions: countryCode
            ? { country: normalizeCountry(countryCode) }
            : undefined,
        })
        autocompleteRef.current = widget
        widget.addListener('place_changed', () => {
          const place = widget.getPlace()
          if (!place?.address_components) return
          onResolveRef.current(parsePlace(place))
        })
        setReady(true)
      } catch {
        // Loader failed — input still functions as a plain text field.
      }
    }
    void bind()

    return () => {
      cancelled = true
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
      autocompleteRef.current = null
      setReady(false)
    }
    // We intentionally only bind once per input mount; country changes are
    // pushed via setComponentRestrictions below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // When the buyer flips the country dropdown, update the restriction so
  // predictions match the new country.
  useEffect(() => {
    if (!autocompleteRef.current || !countryCode) return
    autocompleteRef.current.setComponentRestrictions({
      country: normalizeCountry(countryCode),
    })
  }, [countryCode])

  return { inputRef, ready }
}

function normalizeCountry(country: string | string[]): string | string[] {
  if (Array.isArray(country)) return country.map((c) => c.toLowerCase())
  return country.toLowerCase()
}

export function placesEnabled(): boolean {
  return !!getApiKey()
}
