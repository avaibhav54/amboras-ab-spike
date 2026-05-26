/**
 * Country-specific rules for the region / state / province field on the
 * checkout address form. Covers three things:
 *
 *   1. the **label** the buyer should see (State / Province / County /
 *      Prefecture / Region / Oblast / Department / …),
 *   2. whether the field is **required**, **optional**, or **hidden**
 *      (Germany, France, Netherlands, etc. don't use one in addresses), and
 *   3. (when paired with the subdivisions in countries-states.ts) whether
 *      the field renders as a dropdown or a free-text input.
 *
 * Countries we haven't catalogued fall back to a generic optional
 * "State / Province" text input — same as Shopify's behaviour for
 * unfamiliar destinations.
 */

export type RegionRequirement = 'required' | 'optional' | 'hidden'

export interface RegionRule {
  /** Field label, e.g. "State", "Province", "Prefecture". */
  label: string
  /** Required to submit, optional, or hide the field entirely. */
  requirement: RegionRequirement
}

const REQUIRED_STATE: RegionRule = { label: 'State', requirement: 'required' }
const OPTIONAL_STATE: RegionRule = { label: 'State', requirement: 'optional' }
const REQUIRED_PROVINCE: RegionRule = {
  label: 'Province',
  requirement: 'required',
}
const OPTIONAL_PROVINCE: RegionRule = {
  label: 'Province',
  requirement: 'optional',
}
const HIDDEN: RegionRule = { label: '', requirement: 'hidden' }

export const REGION_RULES: Record<string, RegionRule> = {
  // North America
  US: REQUIRED_STATE,
  CA: REQUIRED_PROVINCE,
  MX: { label: 'State', requirement: 'required' },

  // South America
  BR: { label: 'State', requirement: 'required' },
  AR: REQUIRED_PROVINCE,
  CL: { label: 'Region', requirement: 'required' },
  CO: { label: 'Department', requirement: 'required' },
  PE: { label: 'Department', requirement: 'required' },

  // Europe — most countries don't include an admin region in addresses.
  GB: { label: 'County', requirement: 'optional' },
  IE: { label: 'County', requirement: 'optional' },
  DE: HIDDEN,
  FR: HIDDEN,
  IT: { label: 'Province', requirement: 'optional' },
  ES: { label: 'Province', requirement: 'optional' },
  PT: HIDDEN,
  NL: HIDDEN,
  BE: HIDDEN,
  LU: HIDDEN,
  AT: HIDDEN,
  CH: HIDDEN,
  SE: HIDDEN,
  NO: HIDDEN,
  DK: HIDDEN,
  FI: HIDDEN,
  IS: HIDDEN,
  PL: HIDDEN,
  CZ: HIDDEN,
  SK: HIDDEN,
  HU: HIDDEN,
  RO: HIDDEN,
  BG: HIDDEN,
  GR: HIDDEN,
  HR: HIDDEN,
  SI: HIDDEN,
  EE: HIDDEN,
  LV: HIDDEN,
  LT: HIDDEN,
  RU: { label: 'Oblast / Region', requirement: 'required' },
  UA: { label: 'Oblast', requirement: 'required' },
  TR: { label: 'Province', requirement: 'required' },

  // Asia Pacific
  IN: REQUIRED_STATE,
  CN: REQUIRED_PROVINCE,
  JP: { label: 'Prefecture', requirement: 'required' },
  KR: { label: 'Province / City', requirement: 'optional' },
  TW: { label: 'County / City', requirement: 'required' },
  SG: HIDDEN,
  MY: REQUIRED_STATE,
  TH: REQUIRED_PROVINCE,
  ID: REQUIRED_PROVINCE,
  PH: { label: 'Province', requirement: 'required' },
  VN: REQUIRED_PROVINCE,
  PK: REQUIRED_PROVINCE,
  BD: { label: 'Division', requirement: 'required' },
  LK: OPTIONAL_PROVINCE,
  NP: OPTIONAL_PROVINCE,
  AU: REQUIRED_STATE,
  NZ: { label: 'Region', requirement: 'optional' },

  // Countries with no postal-code system but they still have addressable
  // regions — Hong Kong has districts but no admin region for shipping.
  HK: { label: 'District', requirement: 'optional' },
  MO: HIDDEN,
  AE: { label: 'Emirate', requirement: 'required' },
  QA: HIDDEN,

  // Middle East & Africa
  IL: { label: 'District', requirement: 'optional' },
  SA: { label: 'Region', requirement: 'optional' },
  EG: { label: 'Governorate', requirement: 'required' },
  ZA: REQUIRED_PROVINCE,
  NG: REQUIRED_STATE,
  KE: { label: 'County', requirement: 'optional' },
  MA: { label: 'Region', requirement: 'optional' },
}

/**
 * Fallback rule for countries we haven't catalogued — a generic optional
 * "State / Province" text input. Matches Shopify's behaviour for any
 * destination outside its country-specific schema.
 */
const DEFAULT_RULE: RegionRule = {
  label: 'State / Province',
  requirement: 'optional',
}

export function getRegionRule(countryCode: string | undefined | null): RegionRule {
  if (!countryCode) return DEFAULT_RULE
  return REGION_RULES[countryCode.toUpperCase()] ?? DEFAULT_RULE
}
