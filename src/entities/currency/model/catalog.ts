import type { CurrencyCode } from '@/entities/rates/model/types'
import { FIAT_CURRENCIES } from './catalog-fiat'
import { CRYPTO_CURRENCIES, METAL_CURRENCIES } from './catalog-other'
import type { CurrencyMeta, CurrencyType } from './types'

export const ALL_CURRENCIES: readonly CurrencyMeta[] = [
  ...FIAT_CURRENCIES,
  ...CRYPTO_CURRENCIES,
  ...METAL_CURRENCIES,
]

const BY_CODE: ReadonlyMap<CurrencyCode, CurrencyMeta> = new Map(
  ALL_CURRENCIES.map((meta) => [meta.code, meta]),
)

export function getCurrency(code: CurrencyCode): CurrencyMeta | undefined {
  return BY_CODE.get(code)
}

export function isKnownCurrency(code: CurrencyCode): boolean {
  return BY_CODE.has(code)
}

export function listByType(type: CurrencyType): readonly CurrencyMeta[] {
  switch (type) {
    case 'fiat':
      return FIAT_CURRENCIES
    case 'crypto':
      return CRYPTO_CURRENCIES
    case 'metal':
      return METAL_CURRENCIES
  }
}

/** Case-insensitive search over code and name; empty query returns the full list. */
export function searchCurrencies(
  query: string,
  source: readonly CurrencyMeta[] = ALL_CURRENCIES,
): readonly CurrencyMeta[] {
  const q = query.trim().toLowerCase()
  if (q === '') return source
  return source.filter((meta) => meta.code.includes(q) || meta.name.toLowerCase().includes(q))
}

/** Uppercase code for display: 'gel' → 'GEL'. */
export function displayCode(code: CurrencyCode): string {
  return code.toUpperCase()
}
