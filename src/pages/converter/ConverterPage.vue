<script setup lang="ts">
import { computed } from 'vue'
import { useRatesStore } from '@/entities/rates'
import { useHardwareKeyboard } from '@/features/convert-amount'
import { LastUpdateBar, useRefreshAction } from '@/features/refresh-rates'
import CalculatorKeypad from '@/widgets/calculator-keypad/CalculatorKeypad.vue'
import CurrencyList from '@/widgets/currency-list/CurrencyList.vue'
import { AppIcon } from '@/shared/ui'

const rates = useRatesStore()
const { refresh } = useRefreshAction()
useHardwareKeyboard()

// First launch without network: there is nothing to convert with yet.
const showNoRates = computed(() => !rates.hasRates && rates.status !== 'loading')
</script>

<template>
  <main class="converter">
    <div class="converter__scroll">
      <div v-if="showNoRates" class="converter__notice" role="status">
        <AppIcon name="alert" :size="20" />
        <div class="converter__notice-text">
          <strong>No rates yet</strong>
          <span>Connect to the internet once to download today's rates.</span>
        </div>
        <button type="button" class="converter__notice-button" @click="refresh(true)">Retry</button>
      </div>
      <CurrencyList />
    </div>

    <div class="converter__sheet">
      <div class="converter__grip" aria-hidden="true" />
      <CalculatorKeypad />
      <LastUpdateBar />
    </div>
  </main>
</template>

<style scoped>
.converter {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--nav-height) - var(--safe-bottom));
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
}

.converter__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: calc(var(--space-3) + var(--safe-top)) var(--space-4) var(--space-3);
}

.converter__notice {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-warning) 14%, var(--color-surface));
  color: var(--color-warning);
  font-size: 14px;
}

.converter__notice-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  color: var(--color-text);
}

.converter__notice-text span {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.converter__notice-button {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 600;
}

.converter__sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4) var(--space-3);
  background: var(--color-bg);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: var(--shadow-sheet);
}

.converter__grip {
  width: 44px;
  height: 4px;
  margin: 0 auto;
  border-radius: 2px;
  background: var(--color-border);
}
</style>
