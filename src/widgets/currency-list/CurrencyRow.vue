<script setup lang="ts">
import { CurrencyFlag, displayCode } from '@/entities/currency'
import type { ConverterRow } from '@/features/convert-amount'
import { AppIcon, TrendArrow } from '@/shared/ui'

defineProps<{ row: ConverterRow }>()
</script>

<template>
  <div
    class="currency-row"
    :class="{ 'currency-row--active': row.isActive, 'currency-row--base': row.isBase }"
    role="button"
    tabindex="0"
    :aria-pressed="row.isActive"
    :aria-label="`${row.meta.name}, ${row.display}`"
  >
    <CurrencyFlag :currency="row.meta" />
    <div class="currency-row__info">
      <div class="currency-row__code">
        <span>{{ displayCode(row.code) }}</span>
        <TrendArrow :trend="row.trend" />
      </div>
      <div class="currency-row__name">{{ row.meta.name }}</div>
    </div>
    <div class="currency-row__value">
      <div class="currency-row__amount" :class="{ 'currency-row__amount--editing': row.isActive }">
        <span class="currency-row__amount-text">{{ row.display }}</span>
        <span v-if="row.isActive" class="currency-row__caret" aria-hidden="true" />
      </div>
      <div v-if="row.rateLabel" class="currency-row__rate">{{ row.rateLabel }}</div>
      <div v-else-if="row.isBase" class="currency-row__base-mark" title="Base currency">
        <AppIcon name="shield" :size="14" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.currency-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 76px;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.currency-row--active {
  border-color: var(--color-border-active);
  background: var(--color-surface-active);
}

.currency-row__info {
  flex: 1;
  min-width: 0;
}

.currency-row__code {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.currency-row__name {
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.currency-row__value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex: none;
  max-width: 55%;
}

.currency-row__amount {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  max-width: 100%;
}

.currency-row__amount-text {
  /* With flex-end alignment, overflow spills to the left and is clipped,
     so a long expression always shows its most recent characters. */
  flex: none;
  white-space: nowrap;
}

.currency-row__amount--editing {
  color: var(--color-accent);
}

.currency-row__caret {
  flex: none;
  width: 2px;
  height: 1.05em;
  margin-left: 2px;
  background: var(--color-accent);
  border-radius: 1px;
  animation: blink 1s steps(2, start) infinite;
}

.currency-row__rate {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.currency-row__base-mark {
  display: inline-flex;
  color: var(--color-accent);
  margin-top: 2px;
}

@keyframes blink {
  to {
    visibility: hidden;
  }
}

@media (prefers-reduced-motion: reduce) {
  .currency-row__caret {
    animation: none;
  }
}
</style>
