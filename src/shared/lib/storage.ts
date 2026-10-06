/**
 * Typed key/value persistence on top of localStorage.
 *
 * Falls back to an in-memory map when localStorage is unavailable
 * (private mode on old Safari, disabled storage, SSR-like test envs),
 * so the app keeps working for the session even without persistence.
 */

export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

class MemoryStorage implements KeyValueStorage {
  private readonly map = new Map<string, string>()

  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }
}

function detectStorage(): KeyValueStorage {
  try {
    if (typeof globalThis.localStorage === 'undefined') return new MemoryStorage()
    const probe = '__cr_probe__'
    globalThis.localStorage.setItem(probe, '1')
    globalThis.localStorage.removeItem(probe)
    return globalThis.localStorage
  } catch {
    return new MemoryStorage()
  }
}

export interface TypedStore<T> {
  read(): T | null
  write(value: T): void
  clear(): void
}

export interface TypedStoreOptions<T> {
  /** Validates and optionally migrates raw parsed JSON. Return null to discard. */
  parse?: (raw: unknown) => T | null
}

const PREFIX = 'cr:'

export function createTypedStore<T>(
  key: string,
  options: TypedStoreOptions<T> = {},
  backend: KeyValueStorage = detectStorage(),
): TypedStore<T> {
  const fullKey = PREFIX + key
  const parse = options.parse ?? ((raw: unknown) => raw as T)

  return {
    read(): T | null {
      const text = backend.getItem(fullKey)
      if (text === null) return null
      try {
        return parse(JSON.parse(text))
      } catch {
        return null
      }
    },
    write(value: T): void {
      try {
        backend.setItem(fullKey, JSON.stringify(value))
      } catch {
        // Quota exceeded or storage disabled mid-session: ignore, memory state still holds.
      }
    },
    clear(): void {
      backend.removeItem(fullKey)
    },
  }
}

export { MemoryStorage }
