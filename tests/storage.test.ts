import { describe, expect, it } from 'vitest'
import { createTypedStore, MemoryStorage } from '@/shared/lib/storage'

interface Settings {
  version: number
  name: string
}

describe('createTypedStore', () => {
  it('round-trips JSON values with a prefixed key', () => {
    const backend = new MemoryStorage()
    const store = createTypedStore<Settings>('settings', {}, backend)

    expect(store.read()).toBeNull()
    store.write({ version: 1, name: 'x' })
    expect(store.read()).toEqual({ version: 1, name: 'x' })
    expect(backend.getItem('cr:settings')).toBe('{"version":1,"name":"x"}')
  })

  it('returns null for corrupted JSON', () => {
    const backend = new MemoryStorage()
    backend.setItem('cr:settings', '{not json')
    const store = createTypedStore<Settings>('settings', {}, backend)
    expect(store.read()).toBeNull()
  })

  it('applies a parse/migrate function and can reject values', () => {
    const backend = new MemoryStorage()
    backend.setItem('cr:settings', JSON.stringify({ version: 0, name: 'old' }))
    const store = createTypedStore<Settings>(
      'settings',
      {
        parse: (raw) => {
          const value = raw as Partial<Settings>
          if (typeof value.name !== 'string') return null
          return { version: 1, name: value.name }
        },
      },
      backend,
    )
    expect(store.read()).toEqual({ version: 1, name: 'old' })

    backend.setItem('cr:settings', JSON.stringify({ version: 1 }))
    expect(store.read()).toBeNull()
  })

  it('clears the stored value', () => {
    const backend = new MemoryStorage()
    const store = createTypedStore<Settings>('settings', {}, backend)
    store.write({ version: 1, name: 'x' })
    store.clear()
    expect(store.read()).toBeNull()
  })

  it('swallows backend write failures', () => {
    const failing = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {},
    }
    const store = createTypedStore<Settings>('settings', {}, failing)
    expect(() => store.write({ version: 1, name: 'x' })).not.toThrow()
  })
})
