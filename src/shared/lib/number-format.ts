/**
 * Number formatting shared by all screens.
 * Agreed format: en-US, thousands separators, up to 3 fraction digits.
 */

export const MAX_FRACTION_DIGITS = 3

const fixedFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: MAX_FRACTION_DIGITS,
  maximumFractionDigits: MAX_FRACTION_DIGITS,
})

/** Placeholder shown when a value cannot be computed (missing rate, division by zero). */
export const NOT_AVAILABLE = '—'

/**
 * Formats a converted amount with a fixed 3 decimals so values line up in a
 * column: `1234.5678` → `1,234.568`, `2` → `2.000`. Zero stays a bare `0`.
 */
export function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NOT_AVAILABLE
  // Round first so tiny negatives become a plain zero instead of "-0.000".
  const factor = 10 ** MAX_FRACTION_DIGITS
  const rounded = Math.round(value * factor) / factor
  if (rounded === 0) return '0'
  return fixedFormatter.format(rounded)
}

/** Formats a unit rate with fixed 3 decimals: `0.0773` → `0.077`. */
export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NOT_AVAILABLE
  return fixedFormatter.format(value)
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
