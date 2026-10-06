import type { RatesSnapshot } from '../model/types'

export interface SnapshotPair {
  current: RatesSnapshot | null
  previous: RatesSnapshot | null
}

/**
 * Rotates snapshots after a successful fetch. `previous` only ever holds a
 * snapshot with a different publication date than `current`, so trend arrows
 * compare two distinct days rather than two fetches of the same day.
 */
export function rotateSnapshots(pair: SnapshotPair, incoming: RatesSnapshot): SnapshotPair {
  const { current, previous } = pair
  if (!current) {
    return { current: incoming, previous }
  }
  if (incoming.date === current.date) {
    return { current: incoming, previous }
  }
  return { current: incoming, previous: current }
}

/** Refresh thresholds per provider, in milliseconds. */
export const STALE_AFTER_MS = {
  free: 6 * 60 * 60 * 1000,
  oxr: 60 * 60 * 1000,
} as const

export interface RefreshDecisionInput {
  current: RatesSnapshot | null
  now: number
  staleAfterMs: number
  force?: boolean
}

/**
 * Decides whether a background refresh should run.
 * True when: there is no snapshot, the snapshot's date is not today (UTC),
 * the last fetch is older than `staleAfterMs`, or the user forced it.
 */
export function shouldRefresh({
  current,
  now,
  staleAfterMs,
  force,
}: RefreshDecisionInput): boolean {
  if (force) return true
  if (!current) return true
  if (current.date !== toUtcDate(now)) return true
  return now - current.fetchedAt > staleAfterMs
}

/** Formats an epoch timestamp as YYYY-MM-DD in UTC. */
export function toUtcDate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10)
}

/** Runtime validation for snapshots loaded from storage. */
export function parseSnapshot(raw: unknown): RatesSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Partial<RatesSnapshot>
  if (typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return null
  if (typeof value.fetchedAt !== 'number') return null
  if (value.source !== 'free' && value.source !== 'oxr') return null
  if (value.base !== 'usd') return null
  if (!value.rates || typeof value.rates !== 'object') return null
  const rates: Record<string, number> = {}
  for (const [code, rate] of Object.entries(value.rates)) {
    if (typeof rate === 'number' && Number.isFinite(rate)) rates[code] = rate
  }
  return { date: value.date, fetchedAt: value.fetchedAt, source: value.source, base: 'usd', rates }
}
