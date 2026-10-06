import { describe, expect, it } from 'vitest'
import { convert, crossRate, trend } from '@/entities/rates/lib/convert'
import type { RatesSnapshot } from '@/entities/rates/model/types'

function snapshot(rates: Record<string, number>, date = '2026-10-06'): RatesSnapshot {
  return { date, fetchedAt: 0, source: 'free', base: 'usd', rates: { usd: 1, ...rates } }
}

const today = snapshot({ eur: 0.9, gel: 2.7, thb: 36.0 })

describe('crossRate', () => {
  it('computes rates through the USD base', () => {
    expect(crossRate(today, 'usd', 'gel')).toBeCloseTo(2.7)
    expect(crossRate(today, 'gel', 'usd')).toBeCloseTo(1 / 2.7)
    expect(crossRate(today, 'thb', 'gel')).toBeCloseTo(2.7 / 36)
    expect(crossRate(today, 'eur', 'eur')).toBe(1)
  })

  it('returns null for unknown or unusable currencies', () => {
    expect(crossRate(today, 'xxx', 'gel')).toBeNull()
    expect(crossRate(today, 'gel', 'xxx')).toBeNull()
    expect(crossRate(snapshot({ bad: 0 }), 'bad', 'usd')).toBeNull()
    expect(crossRate(null, 'usd', 'gel')).toBeNull()
  })
})

describe('convert', () => {
  it('multiplies by the cross rate', () => {
    expect(convert(today, 100, 'thb', 'gel')).toBeCloseTo(7.5)
    expect(convert(today, 0, 'thb', 'gel')).toBe(0)
  })

  it('propagates nulls', () => {
    expect(convert(today, null, 'thb', 'gel')).toBeNull()
    expect(convert(today, 100, 'thb', 'xxx')).toBeNull()
  })
})

describe('trend', () => {
  const yesterday = snapshot({ eur: 0.9, gel: 2.8, thb: 36.0 }, '2026-10-05')

  it('reports direction of the unit price in the base currency', () => {
    // 1 GEL used to be 1/2.8 USD, now 1/2.7 USD → GEL went up vs USD.
    expect(trend(today, yesterday, 'gel', 'usd')).toBe('up')
    // 1 USD used to be 2.8 GEL, now 2.7 GEL → USD went down vs GEL.
    expect(trend(today, yesterday, 'usd', 'gel')).toBe('down')
    // THB vs USD unchanged.
    expect(trend(today, yesterday, 'thb', 'usd')).toBeNull()
  })

  it('reflects a change of base currency', () => {
    // THB vs GEL: GEL strengthened, so THB priced in GEL fell.
    expect(trend(today, yesterday, 'thb', 'gel')).toBe('down')
  })

  it('returns null without a previous snapshot or with missing codes', () => {
    expect(trend(today, null, 'gel', 'usd')).toBeNull()
    expect(trend(today, yesterday, 'xxx', 'usd')).toBeNull()
  })
})
