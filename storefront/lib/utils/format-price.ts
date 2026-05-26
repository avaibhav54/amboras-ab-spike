/**
 * Format a price amount (in cents) with the correct locale for the currency.
 *
 * Currencies like EUR, PLN, SEK, NOK, DKK, CZK, CHF display the symbol
 * on the right side (e.g. "0,02 €") using a European locale.
 * Currencies like USD, GBP, CAD, AUD, JPY display it on the left (e.g. "$0.02").
 */

const CURRENCY_LOCALE: Record<string, string> = {
  eur: 'de-DE',
  pln: 'pl-PL',
  sek: 'sv-SE',
  nok: 'nb-NO',
  dkk: 'da-DK',
  czk: 'cs-CZ',
  chf: 'de-CH',
  huf: 'hu-HU',
  ron: 'ro-RO',
  bgn: 'bg-BG',
  hrk: 'hr-HR',
  try: 'tr-TR',
  brl: 'pt-BR',
  rub: 'ru-RU',
}

function getLocale(currencyCode: string): string {
  return CURRENCY_LOCALE[currencyCode.toLowerCase()] || 'en-US'
}

export function formatPrice(amountInCents: number, currencyCode: string): string {
  const locale = getLocale(currencyCode)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100)
}
