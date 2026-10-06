<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { routes } from '@/app/router'
import { useSettingsStore } from '@/entities/settings'
import { useConverterRows, useConverterStore, type ConverterRow } from '@/features/convert-amount'
import { AppIcon, SwipeableRow } from '@/shared/ui'
import CurrencyRow from './CurrencyRow.vue'
import RowActions, { type RowAction } from './RowActions.vue'

const settings = useSettingsStore()
const converter = useConverterStore()
const router = useRouter()
const { baseRow, rows } = useConverterRows()

const ACTIONS_WIDTH = 224

function actionsFor(index: number): RowAction[] {
  return [
    { id: 'base', icon: 'shield', label: 'Make base currency' },
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

function onAction(row: ConverterRow, id: RowAction['id'], close: () => void) {
  switch (id) {
    case 'base':
      settings.setBase(row.code)
      converter.reset()
      break
    case 'up':
      settings.moveUp('selected', row.code)
      break
    case 'down':
      settings.moveDown('selected', row.code)
      break
    case 'delete':
      settings.remove('selected', row.code)
      break
  }
  close()
}

function select(row: ConverterRow) {
  converter.focus(row.code, row.amount)
}

function addCurrency() {
  void router.push({ path: routes.allCurrencies, query: { for: 'main' } })
}

const isEmpty = computed(() => rows.value.length === 0)
</script>

<template>
  <div class="currency-list">
    <CurrencyRow
      v-if="baseRow"
      :row="baseRow"
      @click="select(baseRow)"
      @keydown.enter="select(baseRow)"
    />

    <TransitionGroup name="list" tag="ul" class="currency-list__items">
      <li v-for="(row, index) in rows" :key="row.code">
        <SwipeableRow :id="row.code" :actions-width="ACTIONS_WIDTH" @select="select(row)">
          <template #actions="{ close }">
            <RowActions :actions="actionsFor(index)" @action="(id) => onAction(row, id, close)" />
          </template>
          <CurrencyRow :row="row" @keydown.enter="select(row)" />
        </SwipeableRow>
      </li>
    </TransitionGroup>

    <button type="button" class="currency-list__add" @click="addCurrency">
      <span class="currency-list__add-icon"><AppIcon name="plus" :size="18" /></span>
      <span>{{ isEmpty ? 'Add a currency to convert to' : 'Add new' }}</span>
    </button>
  </div>
</template>

<style scoped>
.currency-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.currency-list__items {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.currency-list__add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 56px;
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 15px;
  font-weight: 500;
}

.currency-list__add:active {
  background: var(--color-surface);
}

.currency-list__add-icon {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-on-accent);
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
