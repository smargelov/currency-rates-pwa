<script setup lang="ts">
import { PageHeader } from '@/shared/ui'
</script>

<template>
  <main class="page">
    <PageHeader title="All currencies" back />
    <p class="placeholder">Currency picker — coming next.</p>
  </main>
</template>

<style scoped>
.page {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.placeholder {
  padding: var(--space-4);
  color: var(--color-text-secondary);
}
</style>
