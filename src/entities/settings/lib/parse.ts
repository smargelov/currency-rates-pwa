import { isKnownCurrency } from '@/entities/currency/model/catalog'
import { DEFAULT_SETTINGS, type UserSettings } from '../model/types'

function cleanCodes(raw: unknown, exclude?: string): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const code = item.toLowerCase()
    if (code === exclude || seen.has(code) || !isKnownCurrency(code)) continue
    seen.add(code)
    result.push(code)
  }
  return result
}

/**
 * Validates settings loaded from storage, filling gaps with defaults and
 * dropping codes that are no longer in the catalog. Never returns null:
 * corrupted settings degrade to defaults rather than breaking the app.
 */
export function parseSettings(raw: unknown): UserSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS }
  const value = raw as Partial<Record<keyof UserSettings, unknown>>

  const baseCandidate = typeof value.baseCode === 'string' ? value.baseCode.toLowerCase() : ''
  const baseCode = isKnownCurrency(baseCandidate) ? baseCandidate : DEFAULT_SETTINGS.baseCode

  return {
    schemaVersion: DEFAULT_SETTINGS.schemaVersion,
    baseCode,
    selected: cleanCodes(value.selected, baseCode),
    cryptoMetals: cleanCodes(value.cryptoMetals),
    provider: value.provider === 'oxr' ? 'oxr' : 'free',
    apiKey: typeof value.apiKey === 'string' ? value.apiKey.trim() : '',
  }
}
