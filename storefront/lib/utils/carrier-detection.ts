/**
 * Carrier detection and tracking URL generation
 * Supports major carriers worldwide
 */

export type CarrierInfo = {
  name: string
  code: string
  trackingUrl: string
  icon?: string
  color?: string
}

const CARRIER_PATTERNS: Array<{
  name: string
  code: string
  pattern: RegExp
  trackingUrl: (trackingNumber: string) => string
  color: string
}> = [
  {
    name: 'UPS',
    code: 'ups',
    pattern: /^1Z[0-9A-Z]{16}$/i,
    trackingUrl: (num) => `https://www.ups.com/track?tracknum=${num}`,
    color: '#351c15',
  },
  {
    name: 'FedEx',
    code: 'fedex',
    pattern: /^(\d{12}|\d{15}|\d{20}|96\d{20})$/,
    trackingUrl: (num) => `https://www.fedex.com/fedextrack/?trknbr=${num}`,
    color: '#4d148c',
  },
  {
    name: 'USPS',
    code: 'usps',
    pattern: /^(94|93|92|94|95)\d{20}$|^[A-Z]{2}\d{9}US$/,
    trackingUrl: (num) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`,
    color: '#333366',
  },
  {
    name: 'DHL',
    code: 'dhl',
    pattern: /^\d{10,11}$|^[A-Z]{3}\d{7}$/,
    trackingUrl: (num) => `https://www.dhl.com/en/express/tracking.html?AWB=${num}`,
    color: '#ffcc00',
  },
  {
    name: 'DHL Express',
    code: 'dhl-express',
    pattern: /^\d{10}$/,
    trackingUrl: (num) => `https://www.dhl.com/en/express/tracking.html?AWB=${num}`,
    color: '#d40511',
  },
  {
    name: 'Amazon Logistics',
    code: 'amazon',
    pattern: /^TBA\d{12}$/,
    trackingUrl: (num) => `https://track.amazon.com/tracking/${num}`,
    color: '#ff9900',
  },
  {
    name: 'Canada Post',
    code: 'canada-post',
    pattern: /^\d{16}$|^[A-Z]{2}\d{9}CA$/,
    trackingUrl: (num) => `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${num}`,
    color: '#e31837',
  },
  {
    name: 'Royal Mail',
    code: 'royal-mail',
    pattern: /^[A-Z]{2}\d{9}GB$/,
    trackingUrl: (num) => `https://www.royalmail.com/track-your-item#/tracking-results/${num}`,
    color: '#e60000',
  },
  {
    name: 'Australia Post',
    code: 'australia-post',
    pattern: /^[A-Z]{2}\d{9}AU$/,
    trackingUrl: (num) => `https://auspost.com.au/mypost/track/#/details/${num}`,
    color: '#e31837',
  },
  {
    name: 'China Post',
    code: 'china-post',
    pattern: /^[A-Z]{2}\d{9}CN$/,
    trackingUrl: (num) => `http://www.ems.com.cn/mailtracking/you_jian_cha_xun.html?mailNum=${num}`,
    color: '#007d3c',
  },
  {
    name: 'LaserShip',
    code: 'lasership',
    pattern: /^1LS\d{12}$/,
    trackingUrl: (num) => `https://www.lasership.com/track/${num}`,
    color: '#003087',
  },
  {
    name: 'OnTrac',
    code: 'ontrac',
    pattern: /^C\d{14}$/,
    trackingUrl: (num) => `https://www.ontrac.com/tracking/?number=${num}`,
    color: '#0066b2',
  },
]

/**
 * Detect carrier from tracking number
 */
export function detectCarrier(trackingNumber: string): CarrierInfo | null {
  const cleanNumber = trackingNumber.trim().toUpperCase().replace(/\s/g, '')

  for (const carrier of CARRIER_PATTERNS) {
    if (carrier.pattern.test(cleanNumber)) {
      return {
        name: carrier.name,
        code: carrier.code,
        trackingUrl: carrier.trackingUrl(cleanNumber),
        color: carrier.color,
      }
    }
  }

  return null
}

/**
 * Generate tracking URL for a carrier + tracking number
 */
export function generateTrackingUrl(carrierCode: string, trackingNumber: string): string | null {
  const cleanNumber = trackingNumber.trim().toUpperCase().replace(/\s/g, '')
  const carrier = CARRIER_PATTERNS.find((c) => c.code === carrierCode)

  if (carrier) {
    return carrier.trackingUrl(cleanNumber)
  }

  // Fallback: try to detect carrier
  const detected = detectCarrier(cleanNumber)
  return detected?.trackingUrl || null
}

/**
 * Format tracking number for display
 */
export function formatTrackingNumber(trackingNumber: string, carrierCode?: string): string {
  const cleanNumber = trackingNumber.trim().toUpperCase().replace(/\s/g, '')

  // UPS: 1Z 999 AA1 01 2345 6784
  if (carrierCode === 'ups' || cleanNumber.startsWith('1Z')) {
    return cleanNumber.replace(/^(1Z)([A-Z0-9]{3})([A-Z0-9]{3})(\d{2})(\d{4})(\d{4})$/, '$1 $2 $3 $4 $5 $6')
  }

  // FedEx: Group in 4s
  if (carrierCode === 'fedex' || /^\d{12,20}$/.test(cleanNumber)) {
    return cleanNumber.match(/.{1,4}/g)?.join(' ') || cleanNumber
  }

  // Default: insert space every 4 characters
  return cleanNumber.match(/.{1,4}/g)?.join(' ') || cleanNumber
}

/**
 * Get carrier display name
 */
export function getCarrierName(carrierCode?: string): string {
  if (!carrierCode) return 'Carrier'

  const carrier = CARRIER_PATTERNS.find((c) => c.code === carrierCode)
  return carrier?.name || carrierCode
}

/**
 * Get all supported carriers
 */
export function getSupportedCarriers(): Array<{ name: string; code: string }> {
  return CARRIER_PATTERNS.map((c) => ({ name: c.name, code: c.code }))
}
