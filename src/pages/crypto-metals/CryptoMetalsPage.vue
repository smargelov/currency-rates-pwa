<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { routes } from '@/app/router'
import { CurrencyFlag, displayCode, getCurrency, type CurrencyMeta } from '@/entities/currency'
import { crossRate, trend, useRatesStore, type Trend } from '@/entities/rates'
import { useSettingsStore } from '@/entities/settings'
import { LastUpdateBar } from '@/features/refresh-rates'
import { formatAmount } from '@/shared/lib/number-format'
import { AppIcon, EmptyState, PageHeader, SwipeableRow, TrendArrow } from '@/shared/ui'
import RowActions, { type RowAction } from '@/widgets/currency-list/RowActions.vue'

interface AssetRow {
  meta: CurrencyMeta
  priceUsd: number | null
  trend: Trend
}

const router = useRouter()
const settings = useSettingsStore()
const rates = useRatesStore()

const ACTIONS_WIDTH = 168

const rows = computed<AssetRow[]>(() =>
  settings.cryptoMetals
    .map((code) => {
      const meta = getCurrency(code)
      if (!meta) return null
      return {
        meta,
        priceUsd: crossRate(rates.current, code, 'usd'),
        trend: trend(rates.current, rates.previous, code, 'usd'),
      }
    })
    .filter((row): row is AssetRow => row !== null),
)

function actionsFor(index: number): RowAction[] {
  return [
    { id: 'up', icon: 'arrow-up', label: 'Move up', disabled: index === 0 },
    {
      id: 'down',
      icon: 'arrow-down',
      label: 'Move down',
      disabled: index === rows.value.length - 1,
    },
    { id: 'delete', icon: 'trash', label: 'Remove' },
  ]
}

function onAction(row: AssetRow, id: RowAction['id'], close: () => void) {
  if (id === 'up') settings.moveUp('cryptoMetals', row.meta.code)
  if (id === 'down') settings.moveDown('cryptoMetals', row.meta.code)
  if (id === 'delete') settings.remove('cryptoMetals', row.meta.code)
  close()
}

function add() {
  void router.push({ path: routes.allCurrencies, query: { for: 'cm', tab: 'crypto' } })
}

const wholeFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const smallFormatter = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 4 })

/** Large prices read better without fraction noise; small ones need more digits. */
function formatPrice(value: number | null): string {
  if (value === null) return formatAmount(null)
  if (value >= 1000) return wholeFormatter.format(value)
  if (value >= 1) return formatAmount(value)
  return smallFormatter.format(value)
}
</script>

<template>
  <main class="assets">
    <PageHeader title="Crypto & Metals">
      <template #actions>
        <button type="button" class="assets__add" aria-label="Add" @click="add">
          <AppIcon name="plus" :size="22" />
        </button>
      </template>
    </PageHeader>

    <div class="assets__scroll">
      <EmptyState
        v-if="rows.length === 0"
        icon="coins"
        title="Nothing here yet"
        description="Pick cryptocurrencies and precious metals to watch their price in USD."
      >
        <button type="button" class="assets__cta" @click="add">
          <AppIcon name="plus" :size="18" />
          Add assets
        </button>
      </EmptyState>

      <TransitionGroup v-else name="list" tag="ul" class="assets__list">
        <li v-for="(row, index) in rows" :key="row.meta.code">
          <SwipeableRow :id="`cm-${row.meta.code}`" :actions-width="ACTIONS_WIDTH">
            <template #actions="{ close }">
              <RowActions :actions="actionsFor(index)" @action="(id) => onAction(row, id, close)" />
            </template>
            <div class="asset">
              <CurrencyFlag :currency="row.meta" />
              <div class="asset__info">
                <div class="asset__code">
                  <span>{{ displayCode(row.meta.code) }}</span>
                  <TrendArrow :trend="row.trend" />
                </div>
                <div class="asset__name">{{ row.meta.name }}</div>
              </div>
              <div class="asset__value">
                <div class="asset__price">{{ formatPrice(row.priceUsd) }}</div>
                <div class="asset__unit">USD</div>
              </div>
            </div>
          </SwipeableRow>
        </li>
      </TransitionGroup>
    </div>

    <div class="assets__footer">
      <LastUpdateBar />
    </div>
  </main>
</template>

<style scoped>
.assets {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--nav-height) - var(--safe-bottom));
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
}

.assets__add {
  display: inline-flex;
  width: var(--tap-target);
  height: var(--tap-target);
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.assets__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-2) var(--space-4) var(--space-3);
}

.assets__list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.assets__cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 600;
}

.assets__footer {
  padding: 0 var(--space-4) var(--space-3);
}

.asset {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 76px;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  user-select: none;
  -webkit-user-select: none;
}

.asset__info {
  flex: 1;
  min-width: 0;
}

.asset__code {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.asset__name {
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asset__value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.asset__price {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.asset__unit {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.list-move,
.list-enter-active,
.list-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
