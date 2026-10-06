<script setup lang="ts">
import { computed } from 'vue'
import type { CurrencyMeta } from '../model/types'

const props = defineProps<{
  currency: CurrencyMeta
  size?: 'sm' | 'md'
}>()

// Fiat currencies render a round country flag (flag-icons 1:1 SVGs copied to
// public/flags at install time). Crypto and metals render a text badge — no icons by design.
const flagSrc = computed(() => (props.currency.flag ? `/flags/${props.currency.flag}.svg` : null))
const badgeText = computed(() => props.currency.code.slice(0, 3).toUpperCase())
</script>

<template>
  <span class="currency-flag" :class="[`currency-flag--${size ?? 'md'}`]" aria-hidden="true">
    <img v-if="flagSrc" :src="flagSrc" alt="" class="currency-flag__image" loading="lazy" />
    <span v-else class="currency-flag__badge" :data-type="currency.type">{{ badgeText }}</span>
  </span>
</template>

<style scoped>
.currency-flag {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--flag-size);
  height: var(--flag-size);
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-surface-2);
}

.currency-flag--md {
  --flag-size: 44px;
}

.currency-flag--sm {
  --flag-size: 36px;
}

.currency-flag__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.currency-flag__badge {
  font-size: calc(var(--flag-size) * 0.3);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-text-secondary);
}

.currency-flag__badge[data-type='metal'] {
  color: var(--color-metal);
}

.currency-flag__badge[data-type='crypto'] {
  color: var(--color-accent);
}
</style>
