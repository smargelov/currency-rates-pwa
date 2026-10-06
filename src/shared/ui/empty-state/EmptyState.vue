<script setup lang="ts">
import AppIcon, { type IconName } from '../icon/AppIcon.vue'

defineProps<{
  icon?: IconName
  title: string
  description?: string
}>()
</script>

<template>
  <div class="empty">
    <AppIcon v-if="icon" :name="icon" :size="32" class="empty__icon" />
    <p class="empty__title">{{ title }}</p>
    <p v-if="description" class="empty__description">{{ description }}</p>
    <div v-if="$slots.default" class="empty__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  text-align: center;
  color: var(--color-text-secondary);
}

.empty__icon {
  color: var(--color-text-muted);
  margin-bottom: var(--space-1);
}

.empty__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.empty__description {
  margin: 0;
  font-size: 14px;
  max-width: 28ch;
}

.empty__actions {
  margin-top: var(--space-2);
}
</style>
