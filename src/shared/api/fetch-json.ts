export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`)
    this.name = 'HttpError'
  }
}

export interface FetchJsonOptions {
  timeoutMs?: number
  signal?: AbortSignal
  fetchImpl?: typeof fetch
}

export const DEFAULT_TIMEOUT_MS = 5000

/**
 * GET + JSON parse with a timeout. Never uses the HTTP cache: freshness is
 * decided by the app, not by CDN headers.
 */
export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, fetchImpl = fetch } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onOuterAbort = () => controller.abort()
  signal?.addEventListener('abort', onOuterAbort, { once: true })

  try {
    const response = await fetchImpl(url, { signal: controller.signal, cache: 'no-store' })
    if (!response.ok) throw new HttpError(response.status, url)
    return (await response.json()) as T
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onOuterAbort)
  }
}
