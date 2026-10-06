import { fetchJson, type FetchJsonOptions } from '@/shared/api/fetch-json'
import type { RatesSnapshot } from '../model/types'
import { ProviderError, type RatesProvider } from './provider'

/**
 * fawazahmed0/exchange-api: static JSON on public CDNs, no keys, no limits,
 * updated daily. The maintainers ask clients to fall back to the second host
 * when the first one fails.
 */
export const FREE_PROVIDER_URLS = [
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json',
  'https://latest.currency-api.pages.dev/v1/currencies/usd.json',
] as const

interface FreeApiResponse {
  date: string
  usd: Record<string, number>
}

export interface FreeProviderOptions {
  urls?: readonly string[]
  fetchOptions?: Omit<FetchJsonOptions, 'signal'>
  now?: () => number
}

export function normalizeFreeResponse(payload: unknown, fetchedAt: number): RatesSnapshot {
  const data = payload as Partial<FreeApiResponse> | null
  if (!data || typeof data.date !== 'string' || !data.usd || typeof data.usd !== 'object') {
    throw new ProviderError('free', 'invalid-response', 'Unexpected response shape')
  }
  const rates: Record<string, number> = { usd: 1 }
  for (const [code, rate] of Object.entries(data.usd)) {
    if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
      rates[code.toLowerCase()] = rate
    }
  }
  return { date: data.date, fetchedAt, source: 'free', base: 'usd', rates }
}

export function createFreeProvider(options: FreeProviderOptions = {}): RatesProvider {
  const urls = options.urls ?? FREE_PROVIDER_URLS
  const now = options.now ?? Date.now

  return {
    id: 'free',
    async fetchLatest(signal) {
      let lastError: unknown = null
      for (const url of urls) {
        if (signal?.aborted) break
        try {
          const payload = await fetchJson<unknown>(url, { ...options.fetchOptions, signal })
          return normalizeFreeResponse(payload, now())
        } catch (error) {
          if (error instanceof ProviderError) throw error
          lastError = error
        }
      }
      throw new ProviderError(
        'free',
        'network',
        lastError instanceof Error ? lastError.message : 'All rate sources failed',
      )
    },
  }
}
