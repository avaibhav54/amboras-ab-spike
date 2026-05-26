/**
 * Country-specific postal-code rules: validation regex, localized label, and
 * an example for placeholder / help text. A small number of countries (UAE,
 * Hong Kong, Panama, …) have no postal-code system at all — those entries
 * use `pattern: null` so the address form can hide the field entirely.
 *
 * Patterns intentionally use the Shopify/Stripe-style "tolerant" regexes
 * (allow lowercase, optional separators), so a buyer typing `sw1a1aa`
 * passes the same as `SW1A 1AA`. The values are normalized on submit by
 * Medusa, not here.
 */

export interface PostalCodeRule {
  /** Regex for client-side validation. `null` = country has no postal code. */
  pattern: RegExp | null
  /** Localized label (defaults to "Postal code" if absent). */
  label?: string
  /** Example value, shown in the validation error message. */
  example?: string
  /**
   * Whether the postal code is required to submit the address. Defaults to
   * 'required' for any entry with a pattern. Marking 'optional' lets the
   * buyer leave it empty (e.g. Ireland, where Eircodes are post-2015 only
   * and legacy addresses still deliver fine without one).
   */
  requirement?: 'required' | 'optional'
}

export const POSTAL_CODE_RULES: Record<string, PostalCodeRule> = {
  // North America
  US: { pattern: /^\d{5}(-\d{4})?$/, label: 'ZIP code', example: '94103' },
  CA: {
    pattern: /^[ABCEGHJKLMNPRSTVXY]\d[A-Z][ -]?\d[A-Z]\d$/i,
    label: 'Postal code',
    example: 'M5V 2T6',
  },
  MX: { pattern: /^\d{5}$/, example: '06600' },

  // South America
  BR: { pattern: /^\d{5}-?\d{3}$/, label: 'CEP', example: '01310-100' },
  AR: { pattern: /^[A-Z]?\d{4}[A-Z]{0,3}$/i, example: 'C1425' },
  CL: { pattern: /^\d{7}$/, example: '8320000' },
  CO: { pattern: /^\d{6}$/, example: '110111' },
  PE: { pattern: /^\d{5}$/, example: '15001' },

  // Europe
  GB: {
    pattern: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
    label: 'Postcode',
    example: 'SW1A 1AA',
  },
  IE: {
    pattern: /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/i,
    label: 'Eircode',
    example: 'D02 X285',
    // Eircodes were only introduced in 2015 — legacy addresses without one
    // still deliver fine, so we never block submission on a missing Eircode.
    requirement: 'optional',
  },
  DE: { pattern: /^\d{5}$/, label: 'PLZ', example: '10115' },
  FR: { pattern: /^\d{5}$/, label: 'Code postal', example: '75001' },
  IT: { pattern: /^\d{5}$/, label: 'CAP', example: '00100' },
  ES: { pattern: /^\d{5}$/, label: 'Código postal', example: '28001' },
  PT: { pattern: /^\d{4}-?\d{3}$/, label: 'Código postal', example: '1100-038' },
  NL: { pattern: /^\d{4}\s?[A-Z]{2}$/i, label: 'Postcode', example: '1011 AB' },
  BE: { pattern: /^\d{4}$/, example: '1000' },
  LU: { pattern: /^\d{4}$/, example: '1009' },
  AT: { pattern: /^\d{4}$/, label: 'PLZ', example: '1010' },
  CH: { pattern: /^\d{4}$/, label: 'PLZ', example: '8001' },
  SE: { pattern: /^\d{3}\s?\d{2}$/, example: '114 35' },
  NO: { pattern: /^\d{4}$/, example: '0150' },
  DK: { pattern: /^\d{4}$/, example: '1050' },
  FI: { pattern: /^\d{5}$/, example: '00100' },
  IS: { pattern: /^\d{3}$/, example: '101' },
  PL: { pattern: /^\d{2}-\d{3}$/, example: '00-001' },
  CZ: { pattern: /^\d{3}\s?\d{2}$/, label: 'PSČ', example: '110 00' },
  SK: { pattern: /^\d{3}\s?\d{2}$/, example: '811 01' },
  HU: { pattern: /^\d{4}$/, example: '1011' },
  RO: { pattern: /^\d{6}$/, example: '010101' },
  BG: { pattern: /^\d{4}$/, example: '1000' },
  GR: { pattern: /^\d{3}\s?\d{2}$/, example: '105 63' },
  HR: { pattern: /^\d{5}$/, example: '10000' },
  SI: { pattern: /^\d{4}$/, example: '1000' },
  EE: { pattern: /^\d{5}$/, example: '10111' },
  LV: { pattern: /^LV-?\d{4}$/i, example: 'LV-1050' },
  LT: { pattern: /^(LT-?)?\d{5}$/i, example: 'LT-01100' },
  RU: { pattern: /^\d{6}$/, example: '101000' },
  UA: { pattern: /^\d{5}$/, example: '01001' },
  TR: { pattern: /^\d{5}$/, example: '34000' },

  // Asia Pacific
  IN: { pattern: /^\d{6}$/, label: 'PIN code', example: '110001' },
  CN: { pattern: /^\d{6}$/, label: 'Postal code', example: '100000' },
  JP: { pattern: /^\d{3}-?\d{4}$/, label: '〒 Postal code', example: '100-0001' },
  KR: { pattern: /^\d{5}$/, example: '04524' },
  TW: { pattern: /^\d{3}(\d{2})?$/, example: '100' },
  SG: { pattern: /^\d{6}$/, example: '178902' },
  MY: { pattern: /^\d{5}$/, example: '50000' },
  TH: { pattern: /^\d{5}$/, example: '10100' },
  ID: { pattern: /^\d{5}$/, example: '10110' },
  PH: { pattern: /^\d{4}$/, example: '1000' },
  VN: { pattern: /^\d{6}$/, example: '100000' },
  PK: { pattern: /^\d{5}$/, example: '44000' },
  BD: { pattern: /^\d{4}$/, example: '1000' },
  LK: { pattern: /^\d{5}$/, example: '00100' },
  NP: { pattern: /^\d{5}$/, example: '44600' },
  AU: { pattern: /^\d{4}$/, example: '2000' },
  NZ: { pattern: /^\d{4}$/, example: '1010' },

  // Middle East & Africa
  IL: { pattern: /^\d{5}(\d{2})?$/, example: '9100000' },
  SA: { pattern: /^\d{5}(-\d{4})?$/, example: '11564' },
  EG: { pattern: /^\d{5}$/, example: '11511' },
  ZA: { pattern: /^\d{4}$/, example: '2000' },
  NG: { pattern: /^\d{6}$/, example: '100001' },
  KE: { pattern: /^\d{5}$/, example: '00100' },
  MA: { pattern: /^\d{5}$/, example: '10000' },

  // Countries with NO postal code system.
  // Setting pattern: null tells the address form to hide the field.
  AE: { pattern: null },
  HK: { pattern: null },
  MO: { pattern: null },
  QA: { pattern: null },
  PA: { pattern: null },
  BS: { pattern: null },
  AG: { pattern: null },
  AO: { pattern: null },
  BJ: { pattern: null },
  BO: { pattern: null },
  BW: { pattern: null },
  BF: { pattern: null },
  BI: { pattern: null },
  CF: { pattern: null },
  CG: { pattern: null },
  CI: { pattern: null },
  CM: { pattern: null },
  DJ: { pattern: null },
  DM: { pattern: null },
  ER: { pattern: null },
  FJ: { pattern: null },
  GD: { pattern: null },
  GH: { pattern: null },
  GM: { pattern: null },
  GQ: { pattern: null },
  GY: { pattern: null },
  KI: { pattern: null },
  KN: { pattern: null },
  KP: { pattern: null },
  LC: { pattern: null },
  ML: { pattern: null },
  MR: { pattern: null },
  NA: { pattern: null },
  NR: { pattern: null },
  RW: { pattern: null },
  SB: { pattern: null },
  SL: { pattern: null },
  SO: { pattern: null },
  SR: { pattern: null },
  ST: { pattern: null },
  SY: { pattern: null },
  TG: { pattern: null },
  TK: { pattern: null },
  TO: { pattern: null },
  TT: { pattern: null },
  TV: { pattern: null },
  UG: { pattern: null },
  VU: { pattern: null },
  YE: { pattern: null },
  ZW: { pattern: null },
}

/** Fallback for countries we haven't catalogued — accepts anything 2-12 chars long. */
const DEFAULT_RULE: PostalCodeRule = {
  pattern: /^[A-Za-z0-9\s-]{2,12}$/,
  label: 'Postal code',
}

/**
 * Look up the postal-code rule for a country. Returns the default rule for
 * unknown countries (lenient regex, generic label).
 */
export function getPostalCodeRule(countryCode: string | undefined | null): PostalCodeRule {
  if (!countryCode) return DEFAULT_RULE
  return POSTAL_CODE_RULES[countryCode.toUpperCase()] ?? DEFAULT_RULE
}

/** True if the country has no postal-code system (UAE, HK, etc.). */
export function hasNoPostalCode(countryCode: string | undefined | null): boolean {
  if (!countryCode) return false
  const rule = POSTAL_CODE_RULES[countryCode.toUpperCase()]
  return rule !== undefined && rule.pattern === null
}
