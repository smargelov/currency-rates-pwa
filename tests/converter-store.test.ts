import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useConverterStore } from '@/features/convert-amount/model/store'

describe('useConverterStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('seeds a newly focused row with the shown amount rounded to 2 decimals', () => {
    const store = useConverterStore()
    store.focus('rub', 15526.534259)
    expect(store.expression).toBe('15526.53')
    expect(store.activeValue).toBe(15526.53)
  })

  it('lets the seeded amount be edited in place', () => {
    const store = useConverterStore()
    store.focus('rub', 16343.72)
    store.press('backspace')
    expect(store.expression).toBe('16343.7')
    store.press('5')
    expect(store.expression).toBe('16343.75')
    store.press('+')
    store.press('1')
    expect(store.activeValue).toBe(16344.75)
  })

  it('treats a shown amount that rounds to zero as empty input', () => {
    const store = useConverterStore()
    store.focus('rub', 0.004)
    expect(store.expression).toBe('')
  })

  it('collapses "=" to at most 2 decimals', () => {
    const store = useConverterStore()
    for (const key of ['1', '0', '/', '3', '='] as const) store.press(key)
    expect(store.expression).toBe('3.33')
  })

  it('re-focusing the active row keeps the expression intact', () => {
    const store = useConverterStore()
    store.press('7')
    store.blur()
    store.focus(store.activeCode, 7)
    expect(store.expression).toBe('7')
    expect(store.focused).toBe(true)
  })
})
