/** Lowercase currency code as used by the rates API: 'usd', 'gel', 'btc'. */
export type CurrencyCode = string

export type ProviderId = 'free' | 'oxr'

/** All rates are stored relative to USD: 1 USD = rates[code] units of `code`. */
export interface RatesSnapshot {
  /** Publication date reported by the provider, YYYY-MM-DD. */
  date: string
  /** Local time the snapshot was fetched, epoch ms. */
  fetchedAt: number
  source: ProviderId
  base: 'usd'
  rates: Record<CurrencyCode, number>
}

export type Trend = 'up' | 'down' | null
