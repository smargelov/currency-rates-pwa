import type { CurrencyCode, ProviderId } from '@/entities/rates/model/types'

export const SETTINGS_SCHEMA_VERSION = 1

export interface UserSettings {
  schemaVersion: typeof SETTINGS_SCHEMA_VERSION
  /** Pinned currency shown at the top of the converter. */
  baseCode: CurrencyCode
  /** Ordered converter rows, never includes `baseCode`. */
  selected: CurrencyCode[]
  /** Ordered rows of the Crypto & Metals tab. */
  cryptoMetals: CurrencyCode[]
  provider: ProviderId
  /** Open Exchange Rates app id, only meaningful when provider is 'oxr'. */
  apiKey: string
}

export const DEFAULT_SETTINGS: UserSettings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  baseCode: 'usd',
  selected: ['eur'],
  cryptoMetals: [],
  provider: 'free',
  apiKey: '',
}
