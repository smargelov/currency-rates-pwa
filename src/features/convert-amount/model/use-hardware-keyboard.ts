import { onBeforeUnmount, onMounted } from 'vue'
import { useConverterStore, type KeypadKey } from './store'

const KEY_MAP: Record<string, KeypadKey> = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '.': '.',
  ',': '.',
  '+': '+',
  '-': '-',
  '*': '*',
  x: '*',
  '/': '/',
  '=': '=',
  Enter: '=',
  Backspace: 'backspace',
  Delete: 'backspace',
  Escape: 'clear',
}

/** Lets desktop users type into the converter with a physical keyboard. */
export function useHardwareKeyboard() {
  const converter = useConverterStore()

  function onKeydown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const target = event.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
    const key = KEY_MAP[event.key]
    if (!key) return
    event.preventDefault()
    converter.press(key)
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
