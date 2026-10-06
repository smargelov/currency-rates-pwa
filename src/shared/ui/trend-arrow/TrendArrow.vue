<script setup lang="ts">
import type { Trend } from '@/entities/rates'

defineProps<{ trend: Trend }>()
</script>

<template>
  <span
    v-if="trend"
    class="trend"
    :class="`trend--${trend}`"
    :aria-label="trend === 'up' ? 'Up since last update' : 'Down since last update'"
    role="img"
  >
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5" />
      <path
        v-if="trend === 'up'"
        d="M8 11.5V4.5M5 7.5l3-3 3 3"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        v-else
        d="M8 4.5v7M5 8.5l3 3 3-3"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </span>
</template>

<style scoped>
.trend {
  display: inline-flex;
  flex: none;
}

.trend--up {
  color: var(--color-up);
}

.trend--down {
  color: var(--color-down);
}
</style>
