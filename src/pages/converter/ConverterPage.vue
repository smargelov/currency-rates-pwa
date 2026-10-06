<script setup lang="ts">
import { LastUpdateBar } from '@/features/refresh-rates'
</script>

<template>
  <main class="page">
    <p class="placeholder">Converter — coming next.</p>
    <LastUpdateBar />
  </main>
</template>

<style scoped>
.page {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
  padding: calc(var(--space-4) + var(--safe-top)) var(--space-4) var(--space-4);
}

.placeholder {
  flex: 1;
  color: var(--color-text-secondary);
}
</style>
