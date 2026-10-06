import { describe, expect, it, vi } from 'vitest'
import { createFreeProvider, normalizeFreeResponse } from '@/entities/rates/api/free-provider'
import { createOxrProvider, normalizeOxrResponse } from '@/entities/rates/api/oxr-provider'
import { ProviderError } from '@/entities/rates/api/provider'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('normalizeFreeResponse', () => {
  it('lowercases codes, drops invalid rates and pins usd to 1', () => {
    const snapshot = normalizeFreeResponse(
      { date: '2026-10-06', usd: { EUR: 0.9, gel: 2.7, zero: 0, neg: -1, text: 'x' } },
      123,
    )
    expect(snapshot).toEqual({
      date: '2026-10-06',
      fetchedAt: 123,
      source: 'free',
      base: 'usd',
      rates: { usd: 1, eur: 0.9, gel: 2.7 },
    })
  })

  it('throws on unexpected shapes', () => {
    expect(() => normalizeFreeResponse({ usd: {} }, 0)).toThrow(ProviderError)
    expect(() => normalizeFreeResponse(null, 0)).toThrow(ProviderError)
  })
})

describe('createFreeProvider', () => {
  const payload = { date: '2026-10-06', usd: { eur: 0.9 } }

  it('uses the primary URL when it succeeds', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse(payload))
    const provider = createFreeProvider({
      urls: ['https://a/usd.json', 'https://b/usd.json'],
      fetchOptions: { fetchImpl },
      now: () => 42,
    })
    const snapshot = await provider.fetchLatest()
    expect(snapshot.rates.eur).toBe(0.9)
    expect(snapshot.fetchedAt).toBe(42)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('https://a/usd.json')
  })

  it('falls back to the second URL on failure', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse(payload))
    const provider = createFreeProvider({
      urls: ['https://a/usd.json', 'https://b/usd.json'],
      fetchOptions: { fetchImpl },
    })
    const snapshot = await provider.fetchLatest()
    expect(snapshot.date).toBe('2026-10-06')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('throws a network ProviderError when every URL fails', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    const provider = createFreeProvider({
      urls: ['https://a', 'https://b'],
      fetchOptions: { fetchImpl },
    })
    await expect(provider.fetchLatest()).rejects.toMatchObject({
      provider: 'free',
      kind: 'network',
    })
  })

  it('does not fall back on an invalid response shape', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ nope: true }))
    const provider = createFreeProvider({
      urls: ['https://a', 'https://b'],
      fetchOptions: { fetchImpl },
    })
    await expect(provider.fetchLatest()).rejects.toMatchObject({ kind: 'invalid-response' })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

describe('normalizeOxrResponse', () => {
  it('derives the date from the timestamp and normalizes rates', () => {
    const snapshot = normalizeOxrResponse(
      { timestamp: Date.UTC(2026, 9, 6, 15) / 1000, base: 'USD', rates: { EUR: 0.9, GEL: 2.7 } },
      7,
    )
    expect(snapshot.date).toBe('2026-10-06')
    expect(snapshot.source).toBe('oxr')
    expect(snapshot.rates).toEqual({ usd: 1, eur: 0.9, gel: 2.7 })
  })

  it('rejects non-USD bases', () => {
    expect(() => normalizeOxrResponse({ timestamp: 1, base: 'EUR', rates: {} }, 0)).toThrow(
      ProviderError,
    )
  })
})

describe('createOxrProvider', () => {
  it('passes the app id and maps auth errors', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse({ error: true }, 401))
    const provider = createOxrProvider({ appId: 'secret key', fetchOptions: { fetchImpl } })
    await expect(provider.fetchLatest()).rejects.toMatchObject({ kind: 'unauthorized' })
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain('app_id=secret%20key')
  })

  it('maps 429 to rate-limited', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 429))
    const provider = createOxrProvider({ appId: 'k', fetchOptions: { fetchImpl } })
    await expect(provider.fetchLatest()).rejects.toMatchObject({ kind: 'rate-limited' })
  })
})
