<script setup lang="ts">
import { useConverterStore, type KeypadKey } from '@/features/convert-amount'
import { AppIcon } from '@/shared/ui'

interface KeyDef {
  key: KeypadKey
  label?: string
  icon?: 'backspace'
  variant?: 'digit' | 'operator' | 'muted'
  span?: 2
  ariaLabel?: string
}

// Layout mirrors the reference app: clear row, three digit rows with the
// operator column on the right, and the bottom row with dot, zero and equals.
const KEYS: readonly KeyDef[] = [
  { key: 'clear', label: 'C', variant: 'muted', span: 2, ariaLabel: 'Clear' },
  { key: 'backspace', icon: 'backspace', variant: 'muted', ariaLabel: 'Backspace' },
  { key: '/', label: '÷', variant: 'operator', ariaLabel: 'Divide' },
  { key: '7', label: '7', variant: 'digit' },
  { key: '8', label: '8', variant: 'digit' },
  { key: '9', label: '9', variant: 'digit' },
  { key: '*', label: '×', variant: 'operator', ariaLabel: 'Multiply' },
  { key: '4', label: '4', variant: 'digit' },
  { key: '5', label: '5', variant: 'digit' },
  { key: '6', label: '6', variant: 'digit' },
  { key: '-', label: '−', variant: 'operator', ariaLabel: 'Subtract' },
  { key: '1', label: '1', variant: 'digit' },
  { key: '2', label: '2', variant: 'digit' },
  { key: '3', label: '3', variant: 'digit' },
  { key: '+', label: '+', variant: 'operator', ariaLabel: 'Add' },
  { key: '.', label: '.', variant: 'digit', ariaLabel: 'Decimal point' },
  { key: '0', label: '0', variant: 'digit' },
  { key: '=', label: '=', variant: 'operator', span: 2, ariaLabel: 'Equals' },
]

const converter = useConverterStore()

function onPress(key: KeypadKey) {
  converter.press(key)
  if ('vibrate' in navigator) navigator.vibrate?.(8)
}
</script>

<template>
  <div class="keypad" role="group" aria-label="Calculator keypad">
    <button
      v-for="item in KEYS"
      :key="item.key"
      type="button"
      class="keypad__key"
      :class="[
        `keypad__key--${item.variant ?? 'digit'}`,
        { 'keypad__key--span-2': item.span === 2 },
      ]"
      :aria-label="item.ariaLabel ?? item.label"
      @pointerdown.prevent
      @click="onPress(item.key)"
    >
      <AppIcon v-if="item.icon" :name="item.icon" :size="24" />
      <template v-else>{{ item.label }}</template>
    </button>
  </div>
</template>

<style scoped>
.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

.keypad__key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  border-radius: var(--radius-md);
  font-size: 24px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  user-select: none;
  -webkit-user-select: none;
  transition:
    background-color 0.1s ease,
    transform 0.05s ease;
}

.keypad__key:active {
  transform: scale(0.96);
}

.keypad__key--span-2 {
  grid-column: span 2;
}

.keypad__key--digit {
  background: var(--color-key);
  color: var(--color-key-text);
}

.keypad__key--digit:active {
  background: var(--color-key-hover);
}

.keypad__key--muted {
  background: var(--color-surface-2);
  color: var(--color-key-muted);
  font-size: 22px;
  font-weight: 600;
}

.keypad__key--operator {
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 26px;
}

.keypad__key--operator:active {
  background: var(--color-accent-hover);
}

@media (max-height: 700px) {
  .keypad__key {
    height: 44px;
    font-size: 20px;
  }
}
</style>
