<script setup lang="ts">
import { computed } from 'vue'
import { useRatesStore } from '@/entities/rates'
import { useRefreshAction } from '../model/use-rates-refresh'

const rates = useRatesStore()
const { refresh } = useRefreshAction()

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

const label = computed(() => {
  if (rates.lastUpdated === null) return 'No rates yet'
  return `${dateFormatter.format(rates.lastUpdated)} ${timeFormatter.format(rates.lastUpdated)}`
})

const isStale = computed(() => {
  if (rates.lastUpdated === null) return false
  return Date.now() - rates.lastUpdated > 24 * 60 * 60 * 1000
})

const hint = computed(() => {
  if (rates.status === 'loading') return 'Updating…'
  if (rates.status === 'error') return 'Update failed'
  if (isStale.value) return 'Rates may be outdated'
  return null
})
</script>

<template>
  <div class="last-update" :class="{ 'last-update--warn': rates.status === 'error' || isStale }">
    <button
      class="last-update__refresh"
      type="button"
      :disabled="rates.status === 'loading'"
      aria-label="Refresh rates"
      @click="refresh(true)"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        :class="{ spin: rates.status === 'loading' }"
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 3v6h-6" />
      </svg>
    </button>
    <span class="last-update__text">
      <template v-if="hint">{{ hint }}</template>
      <template v-else>
        Last update <strong>{{ label }}</strong>
      </template>
    </span>
  </div>
</template>

<style scoped>
.last-update {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 14px;
}

.last-update--warn {
  color: var(--color-warning);
}

.last-update__refresh {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.last-update__refresh:disabled {
  opacity: 0.6;
  cursor: default;
}

.last-update__text {
  flex: 1;
  text-align: center;
  padding-right: 36px;
}

.last-update__text strong {
  color: var(--color-text);
  font-weight: 600;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
