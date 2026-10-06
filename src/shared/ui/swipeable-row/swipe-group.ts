import { ref } from 'vue'

// One open row at a time across the app; a module-level ref is enough.
const openId = ref<string | null>(null)

export function useSwipeGroup() {
  function open(id: string) {
    openId.value = id
  }

  /** Closes the given row, or any open row when no id is passed. */
  function close(id?: string) {
    if (id === undefined || openId.value === id) openId.value = null
  }

  return { openId, open, close }
}
