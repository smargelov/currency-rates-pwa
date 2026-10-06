/**
 * Number formatting shared by all screens.
 * Agreed format: en-US, thousands separators; amounts (what the user types and
 * converted values) carry 2 fraction digits, unit rates under them carry 3.
 */

export const AMOUNT_FRACTION_DIGITS = 2
export const RATE_FRACTION_DIGITS = 3

const amountFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: AMOUNT_FRACTION_DIGITS,
  maximumFractionDigits: AMOUNT_FRACTION_DIGITS,
})
const rateFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: RATE_FRACTION_DIGITS,
  maximumFractionDigits: RATE_FRACTION_DIGITS,
})

/** Placeholder shown when a value cannot be computed (missing rate, division by zero). */
export const NOT_AVAILABLE = '—'

/** Rounds an amount to the 2 decimals shown in inputs: `15526.534259` → `15526.53`. */
export function roundAmount(value: number): number {
  const factor = 10 ** AMOUNT_FRACTION_DIGITS
  return Math.round(value * factor) / factor
}

/**
 * Formats a converted amount with a fixed 2 decimals so values line up in a
 * column: `1234.5678` → `1,234.57`, `2` → `2.00`. Zero stays a bare `0`.
 */
export function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NOT_AVAILABLE
  // Round first so tiny negatives become a plain zero instead of "-0.00".
  const rounded = roundAmount(value)
  if (rounded === 0) return '0'
  return amountFormatter.format(rounded)
}

/** Formats a unit rate with fixed 3 decimals: `0.0773` → `0.077`. */
export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NOT_AVAILABLE
  return rateFormatter.format(value)
}

/**
 * Formats the user's raw input expression for display: numbers get thousands
 * separators while operators and a trailing decimal point are preserved,
 * e.g. `1000+2500.` → `1,000+2,500.`
 */
export function formatExpression(expression: string): string {
  if (expression === '') return '0'
  return expression.replace(/\d+(?:\.\d*)?/g, (token) => {
    const [intPart = '', fracPart] = token.split('.')
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return fracPart === undefined ? grouped : `${grouped}.${fracPart}`
  })
}
