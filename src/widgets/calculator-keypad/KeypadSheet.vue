<script setup lang="ts">
import { useConverterStore } from '@/features/convert-amount'
import { LastUpdateBar } from '@/features/refresh-rates'
import CalculatorKeypad from './CalculatorKeypad.vue'

/**
 * Bottom sheet holding the keypad. Swiping the grip down (or tapping it)
 * collapses the keypad and blurs the active row; tapping a row or the grip
 * brings it back. The "Last update" bar stays visible in both states.
 */
const converter = useConverterStore()

const SWIPE_THRESHOLD = 24

let pointerId: number | null = null
let startY = 0
let handled = false

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  pointerId = event.pointerId
  startY = event.clientY
  handled = false
  ;(event.currentTarget as HTMLElement).setPointerCapture(pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerId !== pointerId || handled) return
  const dy = event.clientY - startY
  if (dy > SWIPE_THRESHOLD) {
    handled = true
    converter.blur()
  } else if (dy < -SWIPE_THRESHOLD) {
    handled = true
    converter.focused = true
  }
}

function onPointerUp(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  pointerId = null
  // A plain tap toggles the sheet.
  if (!handled) converter.focused = !converter.focused
}

function onPointerCancel(event: PointerEvent) {
  if (event.pointerId === pointerId) pointerId = null
}
</script>

<template>
  <div class="sheet" :class="{ 'sheet--collapsed': !converter.focused }">
    <button
      type="button"
      class="sheet__grip"
      :aria-label="converter.focused ? 'Hide keypad' : 'Show keypad'"
      :aria-expanded="converter.focused"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @click.prevent
    >
      <span class="sheet__handle" aria-hidden="true" />
    </button>

    <div class="sheet__keypad" :inert="!converter.focused">
      <div class="sheet__keypad-inner">
        <CalculatorKeypad />
      </div>
    </div>

    <LastUpdateBar />
  </div>
</template>

<style scoped>
.sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0 var(--space-4) var(--space-3);
  background: var(--color-bg);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: var(--shadow-sheet);
}

.sheet__grip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  margin: 0 calc(-1 * var(--space-4)) calc(-1 * var(--space-1));
  touch-action: none;
  cursor: grab;
}

.sheet__grip:active {
  cursor: grabbing;
}

.sheet__handle {
  display: block;
  width: 44px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
  transition: background-color 0.15s ease;
}

.sheet__grip:active .sheet__handle {
  background: var(--color-text-muted);
}

/* Animated collapse via the 0fr/1fr grid trick: no fixed heights needed. */
.sheet__keypad {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.25s ease;
}

.sheet--collapsed .sheet__keypad {
  grid-template-rows: 0fr;
}

.sheet__keypad-inner {
  min-height: 0;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .sheet__keypad {
    transition: none;
  }
}
</style>
