import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { CurrencyCode } from '@/entities/rates'
import { useSettingsStore } from '@/entities/settings'
import {
  appendDigit,
  appendDot,
  appendOperator,
  backspace,
  collapse,
  evaluatePartial,
  isOperator,
  numberToExpression,
} from '@/shared/lib/expression'

export type KeypadKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '.'
  | '+'
  | '-'
  | '*'
  | '/'
  | '='
  | 'backspace'
  | 'clear'

/**
 * Session-only converter state: which row is being edited and the raw
 * expression typed into it. Not persisted — the app always opens with zeros
 * and the base currency focused (agreed in the project canvas).
 */
export const useConverterStore = defineStore('converter', () => {
  const settings = useSettingsStore()

  const activeCode = ref<CurrencyCode>(settings.baseCode)
  const expression = ref('')
  /**
   * Whether a row is being edited. When false no row is highlighted and the
   * keypad is collapsed; `activeCode` still names the row whose value drives
   * the conversions, so the list keeps showing meaningful amounts.
   */
  const focused = ref(true)
  /**
   * After focusing a row that already shows a converted amount, the first
   * digit typed replaces that amount instead of appending to it. Operators
   * keep the amount so "amount + 20" keeps working.
   */
  const fresh = ref(false)

  /** Numeric value of the expression typed so far (null when invalid). */
  const activeValue = computed(() => evaluatePartial(expression.value))

  /** Focuses a row, seeding the expression with the value currently shown in it. */
  function focus(code: CurrencyCode, shownAmount: number | null): void {
    focused.value = true
    if (code === activeCode.value) return
    activeCode.value = code
    expression.value =
      shownAmount === null || shownAmount === 0 ? '' : numberToExpression(shownAmount)
    fresh.value = expression.value !== ''
  }

  /** Leaves edit mode (keypad collapses); the typed value stays in place. */
  function blur(): void {
    focused.value = false
  }

  function press(key: KeypadKey): void {
    focused.value = true
    switch (key) {
      case 'clear':
        expression.value = ''
        fresh.value = false
        return
      case 'backspace':
        expression.value = fresh.value ? '' : backspace(expression.value)
        fresh.value = false
        return
      case '=':
        expression.value = collapse(expression.value)
        if (expression.value === '0') expression.value = ''
        fresh.value = expression.value !== ''
        return
      case '.':
        expression.value = fresh.value ? '0.' : appendDot(expression.value)
        fresh.value = false
        return
      default:
        if (isOperator(key)) {
          expression.value = appendOperator(expression.value, key)
          fresh.value = false
          return
        }
        expression.value = fresh.value ? appendDigit('', key) : appendDigit(expression.value, key)
        fresh.value = false
    }
  }

  /** Returns to the initial state: zeros, base currency focused. */
  function reset(): void {
    activeCode.value = settings.baseCode
    expression.value = ''
    fresh.value = false
    focused.value = true
  }

  /** Called when a row is removed or the base changes under the cursor. */
  function ensureActiveExists(codes: readonly CurrencyCode[]): void {
    if (!codes.includes(activeCode.value)) reset()
  }

  return {
    activeCode,
    expression,
    fresh,
    focused,
    activeValue,
    focus,
    blur,
    press,
    reset,
    ensureActiveExists,
  }
})
