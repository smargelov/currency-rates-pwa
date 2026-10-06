import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { createTypedStore } from '@/shared/lib/storage'
import type { RatesProvider } from '../api/provider'
import { ProviderError } from '../api/provider'
import {
  parseSnapshot,
  previousDateFor,
  rotateSnapshots,
  shouldRefresh,
  STALE_AFTER_MS,
} from '../lib/snapshots'
import type { RatesSnapshot } from './types'

export type RefreshStatus = 'idle' | 'loading' | 'error'

/** Exposed for tests; app code should go through the Pinia store. */
export const snapshotPersistence = {
  current: createTypedStore<RatesSnapshot>('snapshot:current', { parse: parseSnapshot }),
  previous: createTypedStore<RatesSnapshot>('snapshot:previous', { parse: parseSnapshot }),
}
const currentStore = snapshotPersistence.current
const previousStore = snapshotPersistence.previous

export const useRatesStore = defineStore('rates', () => {
  // Snapshots are read synchronously so the first render already has rates.
  const current = shallowRef<RatesSnapshot | null>(currentStore.read())
  const previous = shallowRef<RatesSnapshot | null>(previousStore.read())
  const status = ref<RefreshStatus>('idle')
  const lastError = shallowRef<ProviderError | null>(null)

  let inFlight: Promise<boolean> | null = null
  let previousInFlight: Promise<void> | null = null

  const hasRates = computed(() => current.value !== null)
  const lastUpdated = computed(() => current.value?.fetchedAt ?? null)

  /**
   * Fetches rates through `provider` if the current snapshot is stale (or
   * `force` is set). Concurrent calls share one request. Resolves to `true`
   * when a new snapshot was stored.
   */
  function refresh(provider: RatesProvider, options: { force?: boolean } = {}): Promise<boolean> {
    if (inFlight) return inFlight
    const needed = shouldRefresh({
      current: current.value,
      now: Date.now(),
      staleAfterMs: STALE_AFTER_MS[provider.id],
      force: options.force,
    })
    if (!needed) {
      // Today's rates are fresh, but yesterday's baseline may still be missing.
      void ensurePrevious(provider)
      return Promise.resolve(false)
    }

    status.value = 'loading'
    inFlight = provider
      .fetchLatest()
      .then((incoming) => {
        const rotated = rotateSnapshots(
          { current: current.value, previous: previous.value },
          incoming,
        )
        current.value = rotated.current
        previous.value = rotated.previous
        currentStore.write(rotated.current!)
        if (rotated.previous) previousStore.write(rotated.previous)
        lastError.value = null
        status.value = 'idle'
        // Trend baseline is fetched in the background; the UI never waits for it.
        void ensurePrevious(provider)
        return true
      })
      .catch((error: unknown) => {
        lastError.value =
          error instanceof ProviderError
            ? error
            : new ProviderError(provider.id, 'network', String(error))
        status.value = 'error'
        return false
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  }

  /**
   * Makes sure `previous` holds the snapshot published the day before
   * `current`, so trend arrows compare today with yesterday. Failures are
   * silent: the rotated snapshot (if any) stays as a fallback baseline.
   */
  function ensurePrevious(provider: RatesProvider): Promise<void> {
    if (previousInFlight) return previousInFlight
    const wanted = previousDateFor(current.value, previous.value)
    if (wanted === null) return Promise.resolve()

    previousInFlight = provider
      .fetchForDate(wanted)
      .then((snapshot) => {
        // The baseline must belong to the current snapshot's date; a refresh
        // may have moved `current` while this request was in flight.
        if (previousDateFor(current.value, snapshot) !== null) return
        previous.value = snapshot
        previousStore.write(snapshot)
      })
      .catch(() => {
        // Keep whatever baseline we have.
      })
      .finally(() => {
        previousInFlight = null
      })
    return previousInFlight
  }

  /** Drops the error flag (e.g. after the user changed the API key). */
  function clearError(): void {
    lastError.value = null
    if (status.value === 'error') status.value = 'idle'
  }

  return {
    current,
    previous,
    status,
    lastError,
    hasRates,
    lastUpdated,
    refresh,
    ensurePrevious,
    clearError,
  }
})
