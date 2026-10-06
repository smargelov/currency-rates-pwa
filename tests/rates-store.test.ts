import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ProviderError, type RatesProvider } from '@/entities/rates/api/provider'
import type { RatesSnapshot } from '@/entities/rates/model/types'
import { snapshotPersistence, useRatesStore } from '@/entities/rates/model/store'

function snapshot(date: string, rates: Record<string, number> = { eur: 0.9 }): RatesSnapshot {
  return { date, fetchedAt: Date.now(), source: 'free', base: 'usd', rates: { usd: 1, ...rates } }
}

function fakeProvider(
  latest: RatesSnapshot | Error,
  byDate: Record<string, RatesSnapshot | Error> = {},
): RatesProvider & { fetchForDate: ReturnType<typeof vi.fn> } {
  return {
    id: 'free',
    fetchLatest: vi.fn(async () => {
      if (latest instanceof Error) throw latest
      return latest
    }),
    fetchForDate: vi.fn(async (date: string) => {
      const result = byDate[date]
      if (!result) throw new ProviderError('free', 'network', 'missing')
      if (result instanceof Error) throw result
      return result
    }),
  }
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useRatesStore', () => {
  beforeEach(() => {
    snapshotPersistence.current.clear()
    snapshotPersistence.previous.clear()
    setActivePinia(createPinia())
  })

  it('stores today and then fetches yesterday as the trend baseline', async () => {
    const provider = fakeProvider(snapshot('2026-10-06'), {
      '2026-10-05': snapshot('2026-10-05', { eur: 0.88 }),
    })
    const store = useRatesStore()

    expect(await store.refresh(provider)).toBe(true)
    expect(store.current?.date).toBe('2026-10-06')
    await flush()
    expect(provider.fetchForDate).toHaveBeenCalledWith('2026-10-05')
    expect(store.previous?.date).toBe('2026-10-05')
    expect(snapshotPersistence.previous.read()?.date).toBe('2026-10-05')
  })

  it('keeps the rotated snapshot when the historical fetch fails', async () => {
    snapshotPersistence.current.write(snapshot('2026-10-03'))
    const provider = fakeProvider(snapshot('2026-10-06'))
    const store = useRatesStore()

    await store.refresh(provider)
    await flush()
    expect(store.current?.date).toBe('2026-10-06')
    expect(store.previous?.date).toBe('2026-10-03')
    expect(store.status).toBe('idle')
  })

  it('does not refetch yesterday when it is already stored', async () => {
    snapshotPersistence.current.write(snapshot('2026-10-06'))
    snapshotPersistence.previous.write(snapshot('2026-10-05'))
    const provider = fakeProvider(snapshot('2026-10-06'), {
      '2026-10-05': snapshot('2026-10-05'),
    })
    const store = useRatesStore()

    await store.refresh(provider, { force: true })
    await flush()
    expect(provider.fetchForDate).not.toHaveBeenCalled()
  })

  it('fills a missing baseline even when today is already fresh', async () => {
    const today = new Date().toISOString().slice(0, 10)
    snapshotPersistence.current.write(snapshot(today))
    const provider = fakeProvider(snapshot(today), {})
    const store = useRatesStore()

    expect(await store.refresh(provider)).toBe(false)
    await flush()
    expect(provider.fetchLatest).not.toHaveBeenCalled()
    expect(provider.fetchForDate).toHaveBeenCalledTimes(1)
  })

  it('records provider errors without touching stored rates', async () => {
    snapshotPersistence.current.write(snapshot('2026-10-05'))
    const provider = fakeProvider(new ProviderError('free', 'network', 'offline'))
    const store = useRatesStore()

    expect(await store.refresh(provider)).toBe(false)
    expect(store.status).toBe('error')
    expect(store.lastError?.kind).toBe('network')
    expect(store.current?.date).toBe('2026-10-05')
  })
})
