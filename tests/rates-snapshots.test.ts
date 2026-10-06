import { describe, expect, it } from 'vitest'
import {
  dayBefore,
  parseSnapshot,
  previousDateFor,
  rotateSnapshots,
  shouldRefresh,
  STALE_AFTER_MS,
  toUtcDate,
} from '@/entities/rates/lib/snapshots'
import type { RatesSnapshot } from '@/entities/rates/model/types'

function snapshot(date: string, fetchedAt = 0): RatesSnapshot {
  return { date, fetchedAt, source: 'free', base: 'usd', rates: { usd: 1, eur: 0.9 } }
}

describe('rotateSnapshots', () => {
  it('stores the first snapshot without a previous one', () => {
    const result = rotateSnapshots({ current: null, previous: null }, snapshot('2026-10-06'))
    expect(result.current?.date).toBe('2026-10-06')
    expect(result.previous).toBeNull()
  })

  it('replaces current in place when the date is unchanged', () => {
    const old = snapshot('2026-10-05')
    const pair = { current: snapshot('2026-10-06', 1), previous: old }
    const result = rotateSnapshots(pair, snapshot('2026-10-06', 2))
    expect(result.current?.fetchedAt).toBe(2)
    expect(result.previous).toBe(old)
  })

  it('shifts current to previous when a new date arrives', () => {
    const pair = { current: snapshot('2026-10-05'), previous: snapshot('2026-10-04') }
    const result = rotateSnapshots(pair, snapshot('2026-10-06'))
    expect(result.current?.date).toBe('2026-10-06')
    expect(result.previous?.date).toBe('2026-10-05')
  })
})

describe('shouldRefresh', () => {
  const now = Date.UTC(2026, 9, 6, 12, 0, 0) // 2026-10-06T12:00Z
  const stale = STALE_AFTER_MS.free

  it('refreshes when there is no snapshot', () => {
    expect(shouldRefresh({ current: null, now, staleAfterMs: stale })).toBe(true)
  })

  it('refreshes when the snapshot is from another day', () => {
    const current = snapshot('2026-10-05', now - 1000)
    expect(shouldRefresh({ current, now, staleAfterMs: stale })).toBe(true)
  })

  it('refreshes when the last fetch is older than the threshold', () => {
    const current = snapshot('2026-10-06', now - stale - 1)
    expect(shouldRefresh({ current, now, staleAfterMs: stale })).toBe(true)
  })

  it("skips when today's snapshot was fetched recently", () => {
    const current = snapshot('2026-10-06', now - 1000)
    expect(shouldRefresh({ current, now, staleAfterMs: stale })).toBe(false)
  })

  it('always refreshes when forced', () => {
    const current = snapshot('2026-10-06', now)
    expect(shouldRefresh({ current, now, staleAfterMs: stale, force: true })).toBe(true)
  })

  it('uses a shorter threshold for the keyed provider', () => {
    const current = snapshot('2026-10-06', now - 2 * 60 * 60 * 1000)
    expect(shouldRefresh({ current, now, staleAfterMs: STALE_AFTER_MS.oxr })).toBe(true)
    expect(shouldRefresh({ current, now, staleAfterMs: STALE_AFTER_MS.free })).toBe(false)
  })
})

describe('toUtcDate', () => {
  it('formats in UTC regardless of local zone', () => {
    expect(toUtcDate(Date.UTC(2026, 9, 6, 23, 59))).toBe('2026-10-06')
    expect(toUtcDate(Date.UTC(2026, 9, 7, 0, 0))).toBe('2026-10-07')
  })
})

describe('dayBefore / previousDateFor', () => {
  it('steps back one calendar day across month and year boundaries', () => {
    expect(dayBefore('2026-10-06')).toBe('2026-10-05')
    expect(dayBefore('2026-10-01')).toBe('2026-09-30')
    expect(dayBefore('2026-01-01')).toBe('2025-12-31')
    expect(dayBefore('2028-03-01')).toBe('2028-02-29')
  })

  it('asks for yesterday only when previous does not already hold it', () => {
    const current = snapshot('2026-10-06')
    expect(previousDateFor(current, null)).toBe('2026-10-05')
    expect(previousDateFor(current, snapshot('2026-10-03'))).toBe('2026-10-05')
    expect(previousDateFor(current, snapshot('2026-10-05'))).toBeNull()
    expect(previousDateFor(null, null)).toBeNull()
  })
})

describe('parseSnapshot', () => {
  it('accepts a well-formed snapshot and drops bad rates', () => {
    const parsed = parseSnapshot({
      date: '2026-10-06',
      fetchedAt: 1,
      source: 'free',
      base: 'usd',
      rates: { usd: 1, eur: 0.9, bad: 'x', nan: Number.NaN },
    })
    expect(parsed).toEqual({
      date: '2026-10-06',
      fetchedAt: 1,
      source: 'free',
      base: 'usd',
      rates: { usd: 1, eur: 0.9 },
    })
  })

  it('rejects malformed input', () => {
    expect(parseSnapshot(null)).toBeNull()
    expect(parseSnapshot({ date: 'today' })).toBeNull()
    expect(
      parseSnapshot({ date: '2026-10-06', fetchedAt: 1, source: 'x', base: 'usd', rates: {} }),
    ).toBeNull()
    expect(
      parseSnapshot({ date: '2026-10-06', fetchedAt: 1, source: 'free', base: 'eur', rates: {} }),
    ).toBeNull()
  })
})
