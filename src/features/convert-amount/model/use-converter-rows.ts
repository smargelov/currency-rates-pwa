import { computed, watch } from 'vue'
import { getCurrency, displayCode, type CurrencyMeta } from '@/entities/currency'
import {
  convert,
  crossRate,
  trend,
  useRatesStore,
  type CurrencyCode,
  type Trend,
} from '@/entities/rates'
import { useSettingsStore } from '@/entities/settings'
import { toDisplayOperators } from '@/shared/lib/expression'
import { formatAmount, formatExpression, formatRate } from '@/shared/lib/number-format'
import { useConverterStore } from './store'

export interface ConverterRow {
  code: CurrencyCode
  meta: CurrencyMeta
  isBase: boolean
  isActive: boolean
  /** Converted amount (or the typed value for the active row). */
  amount: number | null
  /** Text shown in the amount slot. */
  display: string
  /** `1 THB = 0.077 GEL` relative to the active row; null for the active row itself. */
  rateLabel: string | null
  /** Daily change of this currency priced in the base currency. */
  trend: Trend
}

/** Builds the view-model for the converter list from settings, rates and input state. */
export function useConverterRows() {
  const settings = useSettingsStore()
  const rates = useRatesStore()
  const converter = useConverterStore()

  const codes = computed<CurrencyCode[]>(() => [settings.baseCode, ...settings.selected])

  // Keep the cursor on an existing row when the list changes under it.
  watch(codes, (next) => converter.ensureActiveExists(next), { immediate: true })

  function buildRow(code: CurrencyCode): ConverterRow | null {
    const meta = getCurrency(code)
    if (!meta) return null
    const isSource = code === converter.activeCode
    const isActive = isSource && converter.focused
    const snapshot = rates.current
    const amount = isSource
      ? converter.activeValue
      : convert(snapshot, converter.activeValue, converter.activeCode, code)

    // While editing, the source row shows the raw expression; once the keypad
    // is dismissed it shows the evaluated amount like every other row.
    const display = isActive
      ? formatExpression(toDisplayOperators(converter.expression))
      : formatAmount(amount)

    const unit = crossRate(snapshot, code, converter.activeCode)
    const rateLabel = isSource
      ? null
      : `1 ${displayCode(code)} = ${formatRate(unit)} ${displayCode(converter.activeCode)}`

    return {
      code,
      meta,
      isBase: code === settings.baseCode,
      isActive,
      amount,
      display,
      rateLabel,
      trend:
        code === settings.baseCode
          ? null
          : trend(rates.current, rates.previous, code, settings.baseCode),
    }
  }

  const baseRow = computed(() => buildRow(settings.baseCode))
  const rows = computed(() =>
    settings.selected.map(buildRow).filter((row): row is ConverterRow => row !== null),
  )

  return { baseRow, rows }
}
