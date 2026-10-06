<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSwipeGroup } from './swipe-group'

const props = withDefaults(
  defineProps<{
    /** Unique id within the list; only one row in a group is open at a time. */
    id: string
    /** Width of the revealed actions panel in px. */
    actionsWidth?: number
    /** Disables swiping (e.g. rows without actions). */
    disabled?: boolean
  }>(),
  { actionsWidth: 224, disabled: false },
)

const emit = defineEmits<{
  /** A tap on the content while the row is closed. */
  select: []
}>()

const TAP_SLOP = 8
const OPEN_THRESHOLD = 0.4

const group = useSwipeGroup()
const offset = ref(0)
const dragging = ref(false)

let startX = 0
let startY = 0
let startOffset = 0
let pointerId: number | null = null
let moved = false
let axis: 'x' | 'y' | null = null

const isOpen = computed(() => group.openId.value === props.id)

watch(isOpen, (open) => {
  if (!dragging.value) offset.value = open ? -props.actionsWidth : 0
})

function clamp(value: number) {
  return Math.min(0, Math.max(-props.actionsWidth, value))
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled || event.button !== 0) return
  pointerId = event.pointerId
  startX = event.clientX
  startY = event.clientY
  startOffset = offset.value
  moved = false
  axis = null
  dragging.value = true
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || event.pointerId !== pointerId) return
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  if (axis === null) {
    if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) return
    axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (axis === 'y') {
      // Vertical gesture: let the page scroll, stop tracking.
      dragging.value = false
      return
    }
    // Keep receiving moves when the finger/cursor leaves the row. Touch pointers
    // are implicitly captured by the inner target, so this re-targets the capture
    // and fires `lostpointercapture` on that inner element — which is why that
    // event must not be treated as a cancelled gesture below.
    ;(event.currentTarget as HTMLElement).setPointerCapture(pointerId)
  }
  moved = true
  offset.value = clamp(startOffset + dx)
}

function finish(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  const wasDragging = dragging.value
  dragging.value = false
  pointerId = null
  if (!wasDragging) return
  if (!moved) {
    if (isOpen.value || group.openId.value !== null) {
      group.close()
    } else {
      emit('select')
    }
    return
  }
  const shouldOpen = -offset.value > props.actionsWidth * OPEN_THRESHOLD
  if (shouldOpen) {
    group.open(props.id)
    offset.value = -props.actionsWidth
  } else {
    group.close(props.id)
    offset.value = 0
  }
}

function onPointerCancel(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  dragging.value = false
  pointerId = null
  offset.value = isOpen.value ? -props.actionsWidth : 0
}

onBeforeUnmount(() => group.close(props.id))

defineExpose({ close: () => group.close(props.id) })
</script>

<template>
  <div class="swipe-row" :class="{ 'swipe-row--open': isOpen }">
    <div class="swipe-row__actions" :style="{ width: `${actionsWidth}px` }" :inert="!isOpen">
      <slot name="actions" :close="() => group.close(id)" />
    </div>
    <div
      class="swipe-row__content"
      :class="{ 'swipe-row__content--dragging': dragging }"
      :style="{ transform: `translateX(${offset}px)` }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="finish"
      @pointercancel="onPointerCancel"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.swipe-row {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.swipe-row__actions {
  position: absolute;
  inset: 0 0 0 auto;
  display: flex;
  align-items: stretch;
}

.swipe-row__content {
  position: relative;
  touch-action: pan-y;
  transition: transform 0.2s ease;
  will-change: transform;
}

.swipe-row__content--dragging {
  transition: none;
}
</style>
