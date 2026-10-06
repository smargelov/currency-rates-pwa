import { computed, reactive, toRefs, watch } from 'vue'
import { defineStore } from 'pinia'
import { createTypedStore } from '@/shared/lib/storage'
import type { CurrencyCode, ProviderId } from '@/entities/rates/model/types'
import { parseSettings } from '../lib/parse'
import { DEFAULT_SETTINGS, type UserSettings } from './types'

/** Exposed for tests and migrations; app code should go through the Pinia store. */
export const settingsPersistence = createTypedStore<UserSettings>('settings', {
  parse: parseSettings,
})

type ListKey = 'selected' | 'cryptoMetals'

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return list
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item as T)
  return copy
}

export const useSettingsStore = defineStore('settings', () => {
  const state = reactive<UserSettings>(settingsPersistence.read() ?? { ...DEFAULT_SETTINGS })

  watch(
    () => ({ ...state, selected: [...state.selected], cryptoMetals: [...state.cryptoMetals] }),
    (snapshot) => settingsPersistence.write(snapshot),
    { deep: true },
  )

  const hasApiKey = computed(() => state.apiKey.length > 0)
  const activeProvider = computed<ProviderId>(() =>
    state.provider === 'oxr' && hasApiKey.value ? 'oxr' : 'free',
  )

  /** Makes `code` the base; the old base takes its place in the list. */
  function setBase(code: CurrencyCode): void {
    if (code === state.baseCode) return
    const index = state.selected.indexOf(code)
    const next = [...state.selected]
    if (index >= 0) {
      next.splice(index, 1, state.baseCode)
    } else {
      next.unshift(state.baseCode)
    }
    state.selected = next
    state.baseCode = code
  }

  function add(list: ListKey, code: CurrencyCode): void {
    if (list === 'selected' && code === state.baseCode) return
    if (state[list].includes(code)) return
    state[list] = [...state[list], code]
  }

  function remove(list: ListKey, code: CurrencyCode): void {
    state[list] = state[list].filter((item) => item !== code)
  }

  function toggle(list: ListKey, code: CurrencyCode): void {
    if (state[list].includes(code)) remove(list, code)
    else add(list, code)
  }

  function moveUp(list: ListKey, code: CurrencyCode): void {
    const index = state[list].indexOf(code)
    state[list] = moveItem(state[list], index, index - 1)
  }

  function moveDown(list: ListKey, code: CurrencyCode): void {
    const index = state[list].indexOf(code)
    state[list] = moveItem(state[list], index, index + 1)
  }

  function setProvider(provider: ProviderId): void {
    state.provider = provider
  }

  function setApiKey(key: string): void {
    state.apiKey = key.trim()
  }

  return {
    ...toRefs(state),
    hasApiKey,
    activeProvider,
    setBase,
    add,
    remove,
    toggle,
    moveUp,
    moveDown,
    setProvider,
    setApiKey,
  }
})
