import type { CurrencyCode } from '@/entities/rates/model/types'

export type CurrencyType = 'fiat' | 'crypto' | 'metal'

export interface CurrencyMeta {
  /** Lowercase code as used by the rates API. */
  code: CurrencyCode
  /** Human-readable name, English. */
  name: string
  type: CurrencyType
  /** ISO 3166-1 alpha-2 country code for the flag (fiat only). */
  flag?: string
  /** Currency symbol, when there is a widely recognized one. */
  symbol?: string
}
