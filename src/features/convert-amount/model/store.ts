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
import { AMOUNT_FRACTION_DIGITS, roundAmount } from '@/shared/lib/number-format'

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

  /** Numeric value of the expression typed so far (null when invalid). */
  const activeValue = computed(() => evaluatePartial(expression.value))

  /**
   * Focuses a row, seeding the expression with the value currently shown in
   * it — rounded to the 2 decimals the row displays. The seed is ordinary
   * input from then on: backspace trims it, digits and operators extend it,
   * so a converted result can be adjusted in place.
   */
  function focus(code: CurrencyCode, shownAmount: number | null): void {
    focused.value = true
    if (code === activeCode.value) return
    activeCode.value = code
    const seed = shownAmount === null ? 0 : roundAmount(shownAmount)
    expression.value = seed === 0 ? '' : numberToExpression(seed, AMOUNT_FRACTION_DIGITS)
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
        return
      case 'backspace':
        expression.value = backspace(expression.value)
        return
      case '=':
        expression.value = collapse(expression.value, AMOUNT_FRACTION_DIGITS)
        if (expression.value === '0') expression.value = ''
        return
      case '.':
        expression.value = appendDot(expression.value)
        return
      default:
        expression.value = isOperator(key)
          ? appendOperator(expression.value, key)
          : appendDigit(expression.value, key)
    }
  }

  /** Returns to the initial state: zeros, base currency focused. */
  function reset(): void {
    activeCode.value = settings.baseCode
    expression.value = ''
    focused.value = true
  }

  /** Called when a row is removed or the base changes under the cursor. */
  function ensureActiveExists(codes: readonly CurrencyCode[]): void {
    if (!codes.includes(activeCode.value)) reset()
  }

  return {
    activeCode,
    expression,
    focused,
    activeValue,
    focus,
    blur,
    press,
    reset,
    ensureActiveExists,
  }
})
