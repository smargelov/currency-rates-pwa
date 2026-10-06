import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useDebounced } from '@/shared/lib/use-debounced'

describe('useDebounced', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('applies the latest value only after the quiet period', async () => {
    const source = ref('')
    const { debounced } = useDebounced(source, 300)
    source.value = 'u'
    await nextTick()
    source.value = 'us'
    await nextTick()
    vi.advanceTimersByTime(299)
    expect(debounced.value).toBe('')
    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('us')
  })

  it('flush applies the pending value immediately', async () => {
    const source = ref('usd')
    const { debounced, flush } = useDebounced(source, 300)
    source.value = ''
    await nextTick()
    flush()
    expect(debounced.value).toBe('')
    vi.advanceTimersByTime(300)
    expect(debounced.value).toBe('')
  })

  it('cancels the pending timer when the scope is disposed', async () => {
    const source = ref('a')
    const scope = effectScope()
    const result = scope.run(() => useDebounced(source, 300))!
    source.value = 'b'
    await nextTick()
    scope.stop()
    vi.advanceTimersByTime(300)
    expect(result.debounced.value).toBe('a')
  })
})
