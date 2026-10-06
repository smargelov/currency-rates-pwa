import { onScopeDispose, ref, watch, type Ref } from 'vue'

/**
 * Mirrors `source` into a ref that updates only after `delayMs` of quiet.
 * `flush()` applies the pending value at once (e.g. when the input is cleared).
 */
export function useDebounced<T>(source: Ref<T>, delayMs: number) {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancel() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function flush() {
    cancel()
    debounced.value = source.value
  }

  watch(source, (value) => {
    cancel()
    timer = setTimeout(() => {
      timer = null
      debounced.value = value
    }, delayMs)
  })

  onScopeDispose(cancel)

  return { debounced, flush }
}
