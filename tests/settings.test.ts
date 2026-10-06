import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { parseSettings } from '@/entities/settings/lib/parse'
import { DEFAULT_SETTINGS } from '@/entities/settings/model/types'
import { settingsPersistence, useSettingsStore } from '@/entities/settings/model/store'

describe('parseSettings', () => {
  it('returns defaults for garbage', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS)
  })

  it('normalizes codes, removes unknowns, duplicates and the base from the list', () => {
    const parsed = parseSettings({
      baseCode: 'GEL',
      selected: ['usd', 'USD', 'gel', 'nope', 'thb', 42],
      cryptoMetals: ['btc', 'xau', 'btc'],
      provider: 'oxr',
      apiKey: '  key  ',
    })
    expect(parsed).toEqual({
      schemaVersion: 1,
      baseCode: 'gel',
      selected: ['usd', 'thb'],
      cryptoMetals: ['btc', 'xau'],
      provider: 'oxr',
      apiKey: 'key',
    })
  })

  it('falls back to USD when the base is unknown', () => {
    expect(parseSettings({ baseCode: 'zzz', selected: ['usd'] }).baseCode).toBe('usd')
    expect(parseSettings({ baseCode: 'zzz', selected: ['usd'] }).selected).toEqual([])
  })
})

describe('useSettingsStore', () => {
  beforeEach(() => {
    settingsPersistence.clear()
    setActivePinia(createPinia())
  })

  it('starts with defaults', () => {
    const store = useSettingsStore()
    expect(store.baseCode).toBe('usd')
    expect(store.selected).toEqual(['eur'])
  })

  it('swaps the base with a listed currency in place', () => {
    const store = useSettingsStore()
    store.add('selected', 'gel')
    store.add('selected', 'thb')
    store.setBase('gel')
    expect(store.baseCode).toBe('gel')
    expect(store.selected).toEqual(['eur', 'usd', 'thb'])
  })

  it('pushes the old base to the top when the new base is not listed', () => {
    const store = useSettingsStore()
    store.setBase('gel')
    expect(store.baseCode).toBe('gel')
    expect(store.selected).toEqual(['usd', 'eur'])
  })

  it('does not add the base or duplicates to the list', () => {
    const store = useSettingsStore()
    store.add('selected', 'usd')
    store.add('selected', 'eur')
    expect(store.selected).toEqual(['eur'])
  })

  it('moves items up and down within bounds', () => {
    const store = useSettingsStore()
    store.add('selected', 'gel')
    store.add('selected', 'thb')
    store.moveUp('selected', 'thb')
    expect(store.selected).toEqual(['eur', 'thb', 'gel'])
    store.moveUp('selected', 'eur')
    expect(store.selected).toEqual(['eur', 'thb', 'gel'])
    store.moveDown('selected', 'gel')
    expect(store.selected).toEqual(['eur', 'thb', 'gel'])
    store.moveDown('selected', 'eur')
    expect(store.selected).toEqual(['thb', 'eur', 'gel'])
  })

  it('toggles and removes', () => {
    const store = useSettingsStore()
    store.toggle('cryptoMetals', 'btc')
    expect(store.cryptoMetals).toEqual(['btc'])
    store.toggle('cryptoMetals', 'btc')
    expect(store.cryptoMetals).toEqual([])
    store.remove('selected', 'eur')
    expect(store.selected).toEqual([])
  })

  it('only activates the keyed provider when a key is present', () => {
    const store = useSettingsStore()
    store.setProvider('oxr')
    expect(store.activeProvider).toBe('free')
    store.setApiKey(' abc ')
    expect(store.apiKey).toBe('abc')
    expect(store.activeProvider).toBe('oxr')
  })
})
