import type { CurrencyCode, RatesSnapshot, Trend } from '../model/types'

/**
 * Cross rate: how many units of `to` one unit of `from` buys.
 * Returns null when either currency is missing or has a non-positive rate.
 */
export function crossRate(
  snapshot: RatesSnapshot | null,
  from: CurrencyCode,
  to: CurrencyCode,
): number | null {
  if (!snapshot) return null
  const fromRate = snapshot.rates[from]
  const toRate = snapshot.rates[to]
  if (!isUsableRate(fromRate) || !isUsableRate(toRate)) return null
  return toRate / fromRate
}

/** Converts `amount` of `from` into `to`. */
export function convert(
  snapshot: RatesSnapshot | null,
  amount: number | null,
  from: CurrencyCode,
  to: CurrencyCode,
): number | null {
  if (amount === null) return null
  const rate = crossRate(snapshot, from, to)
  if (rate === null) return null
  return amount * rate
}

/**
 * Direction of change of `code` priced in `base` between two snapshots.
 * `up` means one unit of `code` now buys more `base` than before.
 */
export function trend(
  current: RatesSnapshot | null,
  previous: RatesSnapshot | null,
  code: CurrencyCode,
  base: CurrencyCode,
): Trend {
  const now = crossRate(current, code, base)
  const before = crossRate(previous, code, base)
  if (now === null || before === null) return null
  if (now > before) return 'up'
  if (now < before) return 'down'
  return null
}

function isUsableRate(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
