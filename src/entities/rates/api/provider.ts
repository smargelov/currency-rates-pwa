import type { ProviderId, RatesSnapshot } from '../model/types'

export interface RatesProvider {
  readonly id: ProviderId
  fetchLatest(signal?: AbortSignal): Promise<RatesSnapshot>
}

export class ProviderError extends Error {
  constructor(
    public readonly provider: ProviderId,
    public readonly kind: 'network' | 'unauthorized' | 'rate-limited' | 'invalid-response',
    message: string,
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}
