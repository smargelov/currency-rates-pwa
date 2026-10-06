import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DONATION_METHODS, parseDonations } from '@/features/donations/model/donation-methods'
import {
  DONATIONS_URL,
  resetDonationsCache,
  useDonations,
} from '@/features/donations/model/use-donations'

describe('parseDonations', () => {
  it('returns [] for anything that is not an object', () => {
    expect(parseDonations(null)).toEqual([])
    expect(parseDonations('x')).toEqual([])
    expect(parseDonations([])).toEqual([])
  })

  it('keeps only known ids with non-blank string values, in catalog order', () => {
    const parsed = parseDonations({
      btc: ' bc1q ',
      ton: 'UQ1',
      iban_tbc: '',
      iban_bog: 42,
      paypal: 'nope',
    })
    expect(parsed.map((m) => m.id)).toEqual(['ton', 'btc'])
    expect(parsed[1]).toMatchObject({ id: 'btc', value: 'bc1q', title: 'BTC', subtitle: 'Bitcoin' })
  })

  it('every catalog entry has a unique id and env var', () => {
    const ids = new Set(DONATION_METHODS.map((m) => m.id))
    const vars = new Set(DONATION_METHODS.map((m) => m.envVar))
    expect(ids.size).toBe(DONATION_METHODS.length)
    expect(vars.size).toBe(DONATION_METHODS.length)
    for (const m of DONATION_METHODS) expect(m.envVar).toMatch(/^DONATE_[A-Z0-9_]+$/)
  })
})

describe('useDonations', () => {
  beforeEach(() => resetDonationsCache())

  it('loads once and shares the result', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json({ eth: '0xabc', unknown: 'x' }))
    const a = useDonations(fetchMock)
    const b = useDonations(fetchMock)
    await Promise.all([a.ensureLoaded(), b.ensureLoaded()])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(DONATIONS_URL)
    expect(a.methods.value.map((m) => m.id)).toEqual(['eth'])
    expect(b.status.value).toBe('ready')
  })

  it('treats a 404 as "nothing configured"', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('', { status: 404 }))
    const d = useDonations(fetchMock)
    await d.ensureLoaded()
    expect(d.methods.value).toEqual([])
    expect(d.status.value).toBe('ready')
  })

  it('reports an error on network failure and allows a retry', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(Response.json({ btc: 'bc1q' }))
    const d = useDonations(fetchMock)
    await d.ensureLoaded()
    expect(d.status.value).toBe('error')
    await d.ensureLoaded()
    expect(d.methods.value.map((m) => m.id)).toEqual(['btc'])
  })
})
