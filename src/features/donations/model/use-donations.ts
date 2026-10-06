import { readonly, ref, shallowRef } from 'vue'
import { parseDonations, type DonationMethod } from './donation-methods'

export const DONATIONS_URL = '/donations.json'

export type DonationsStatus = 'idle' | 'loading' | 'ready' | 'error'

// Module-level state: the file is fetched once per page load and shared by
// every component that asks for it.
const methods = shallowRef<DonationMethod[]>([])
const status = ref<DonationsStatus>('idle')
let inFlight: Promise<void> | null = null

async function load(fetchImpl: typeof fetch): Promise<void> {
  status.value = 'loading'
  try {
    const response = await fetchImpl(DONATIONS_URL, { cache: 'no-cache' })
    // In dev there is no generated file — a 404 simply means "nothing configured".
    if (!response.ok) {
      methods.value = []
      status.value = 'ready'
      return
    }
    methods.value = parseDonations(await response.json())
    status.value = 'ready'
  } catch {
    methods.value = []
    status.value = 'error'
  }
}

/**
 * Donation methods configured for this deployment. Loads lazily on first use;
 * the list is empty until the file arrives, so callers can render nothing
 * while waiting and simply hide the section when there is nothing to show.
 */
export function useDonations(fetchImpl: typeof fetch = globalThis.fetch?.bind(globalThis)) {
  function ensureLoaded(): Promise<void> {
    if (status.value === 'ready') return Promise.resolve()
    if (!inFlight) {
      inFlight = load(fetchImpl).finally(() => {
        inFlight = null
      })
    }
    return inFlight
  }

  return { methods: readonly(methods), status: readonly(status), ensureLoaded }
}

/** Test helper: forgets the cached result. */
export function resetDonationsCache(): void {
  methods.value = []
  status.value = 'idle'
  inFlight = null
}
