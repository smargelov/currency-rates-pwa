<script setup lang="ts">
defineProps<{
  title: string
  /** Shows a back chevron that navigates to the previous route. */
  back?: boolean
}>()
</script>

<template>
  <header class="page-header">
    <button
      v-if="back"
      class="page-header__back"
      type="button"
      aria-label="Back"
      @click="$router.back()"
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m15 5-7 7 7 7" />
      </svg>
    </button>
    <h1 class="page-header__title">{{ title }}</h1>
    <div class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 56px;
  padding: calc(var(--space-2) + var(--safe-top)) var(--space-4) var(--space-2);
}

.page-header__back {
  display: inline-flex;
  width: var(--tap-target);
  height: var(--tap-target);
  margin-left: calc(-1 * var(--space-2));
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--color-text-secondary);
}

.page-header__title {
  flex: 1;
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.page-header__actions {
  display: flex;
  gap: var(--space-2);
}
</style>
