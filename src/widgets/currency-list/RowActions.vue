<script setup lang="ts">
import { AppIcon, type IconName } from '@/shared/ui'

export interface RowAction {
  id: 'base' | 'up' | 'down' | 'delete'
  icon: IconName
  label: string
  disabled?: boolean
}

defineProps<{ actions: readonly RowAction[] }>()

const emit = defineEmits<{ action: [id: RowAction['id']] }>()
</script>

<template>
  <div class="row-actions">
    <button
      v-for="action in actions"
      :key="action.id"
      type="button"
      class="row-actions__button"
      :class="`row-actions__button--${action.id}`"
      :disabled="action.disabled"
      :aria-label="action.label"
      :title="action.label"
      @click="emit('action', action.id)"
    >
      <AppIcon :name="action.icon" :size="22" />
    </button>
  </div>
</template>

<style scoped>
.row-actions {
  display: flex;
  width: 100%;
  background: var(--color-surface-2);
  border-radius: var(--radius-md);
}

.row-actions__button {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition: background-color 0.1s ease;
}

.row-actions__button:active {
  background: var(--color-border);
}

.row-actions__button:disabled {
  color: var(--color-text-muted);
  cursor: default;
}

.row-actions__button--base {
  color: var(--color-accent);
}

.row-actions__button--delete {
  color: var(--color-down);
}
</style>
