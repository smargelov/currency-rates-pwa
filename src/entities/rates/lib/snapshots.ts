import type { RatesSnapshot } from '../model/types'

export interface SnapshotPair {
  current: RatesSnapshot | null
  previous: RatesSnapshot | null
}

/**
 * Rotates snapshots after a successful fetch. `previous` only ever holds a
 * snapshot with a different publication date than `current`. This is the
 * cheap fallback for trend arrows; the store then tries to replace `previous`
 * with the snapshot published exactly one day before `current` (see
 * `previousDateFor`), so arrows compare today with yesterday even if the app
 * was not opened yesterday.
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

/** The calendar day before a YYYY-MM-DD date, computed in UTC. */
export function dayBefore(date: string): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  return toUtcDate(Date.UTC(year, month - 1, day - 1))
}

/**
 * The publication date whose snapshot should sit in `previous` for a given
 * `current`, or null when `previous` already holds it.
 */
export function previousDateFor(
  current: RatesSnapshot | null,
  previous: RatesSnapshot | null,
): string | null {
  if (!current) return null
  const wanted = dayBefore(current.date)
  return previous?.date === wanted ? null : wanted
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
