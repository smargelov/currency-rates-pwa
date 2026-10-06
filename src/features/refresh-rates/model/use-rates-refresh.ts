import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import {
  createFreeProvider,
  createOxrProvider,
  useRatesStore,
  type RatesProvider,
} from '@/entities/rates'
import { useSettingsStore } from '@/entities/settings'

const freeProvider = createFreeProvider()

/** Resolves the active provider from settings and exposes a refresh action. */
export function useRefreshAction() {
  const settings = useSettingsStore()
  const rates = useRatesStore()

  const provider = computed<RatesProvider>(() =>
    settings.activeProvider === 'oxr'
      ? createOxrProvider({ appId: settings.apiKey })
      : freeProvider,
  )

  function refresh(force = false) {
    return rates.refresh(provider.value, { force })
  }

  return { refresh }
}

/**
 * Wires the refresh policy to the app lifecycle: start, tab becoming
 * visible, network coming back, and provider/key changes. Call once, from
 * the root component.
 */
export function useRatesRefreshLifecycle() {
  const settings = useSettingsStore()
  const rates = useRatesStore()
  const { refresh } = useRefreshAction()

  function onVisibility() {
    if (document.visibilityState === 'visible') void refresh()
  }

  function onOnline() {
    void refresh()
  }

  onMounted(() => {
    void refresh()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('online', onOnline)
  })

  // Switching provider or key should fetch immediately so the user sees the effect.
  watch(
    () => [settings.activeProvider, settings.apiKey] as const,
    () => {
      rates.clearError()
      void refresh(true)
    },
  )
}
