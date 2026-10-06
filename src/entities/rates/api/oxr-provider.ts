import { fetchJson, HttpError, type FetchJsonOptions } from '@/shared/api/fetch-json'
import type { RatesSnapshot } from '../model/types'
import { ProviderError, type RatesProvider } from './provider'

/**
 * Open Exchange Rates with a user-supplied app id. Free tier: hourly updates,
 * USD base only — which is exactly what the app needs.
 */
export const OXR_LATEST_URL = 'https://openexchangerates.org/api/latest.json'

interface OxrResponse {
  timestamp: number
  base: string
  rates: Record<string, number>
}

export interface OxrProviderOptions {
  appId: string
  url?: string
  fetchOptions?: Omit<FetchJsonOptions, 'signal'>
  now?: () => number
}

export function normalizeOxrResponse(payload: unknown, fetchedAt: number): RatesSnapshot {
  const data = payload as Partial<OxrResponse> | null
  if (
    !data ||
    typeof data.timestamp !== 'number' ||
    data.base !== 'USD' ||
    !data.rates ||
    typeof data.rates !== 'object'
  ) {
    throw new ProviderError('oxr', 'invalid-response', 'Unexpected response shape')
  }
  const rates: Record<string, number> = { usd: 1 }
  for (const [code, rate] of Object.entries(data.rates)) {
    if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
      rates[code.toLowerCase()] = rate
    }
  }
  const date = new Date(data.timestamp * 1000).toISOString().slice(0, 10)
  return { date, fetchedAt, source: 'oxr', base: 'usd', rates }
}

export function createOxrProvider(options: OxrProviderOptions): RatesProvider {
  const now = options.now ?? Date.now
  const base = options.url ?? OXR_LATEST_URL

  return {
    id: 'oxr',
    async fetchLatest(signal) {
      const url = `${base}?app_id=${encodeURIComponent(options.appId)}`
      try {
        const payload = await fetchJson<unknown>(url, { ...options.fetchOptions, signal })
        return normalizeOxrResponse(payload, now())
      } catch (error) {
        if (error instanceof ProviderError) throw error
        if (error instanceof HttpError) {
          if (error.status === 401 || error.status === 403) {
            throw new ProviderError('oxr', 'unauthorized', 'API key rejected')
          }
          if (error.status === 429) {
            throw new ProviderError('oxr', 'rate-limited', 'Monthly request limit reached')
          }
        }
        throw new ProviderError(
          'oxr',
          'network',
          error instanceof Error ? error.message : 'Request failed',
        )
      }
    },
  }
}
