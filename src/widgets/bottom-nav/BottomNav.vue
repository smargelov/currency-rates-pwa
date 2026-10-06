<script setup lang="ts">
import { routes } from '@/app/router'
import { AppIcon } from '@/shared/ui'

const items = [
  { to: routes.converter, name: 'converter', label: 'Converter', icon: 'home' },
  { to: routes.cryptoMetals, name: 'crypto-metals', label: 'Crypto & Metals', icon: 'coins' },
  { to: routes.settings, name: 'settings', label: 'Settings', icon: 'settings' },
] as const
</script>

<template>
  <nav class="bottom-nav" aria-label="Main">
    <RouterLink
      v-for="item in items"
      :key="item.name"
      :to="item.to"
      class="bottom-nav__item"
      active-class="bottom-nav__item--active"
      :exact-active-class="item.name === 'converter' ? 'bottom-nav__item--active' : undefined"
      :aria-label="item.label"
    >
      <AppIcon :name="item.icon" :size="26" />
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  inset: auto 0 0 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: calc(var(--nav-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
  z-index: 10;
}

.bottom-nav__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: var(--tap-target);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  transition: color 0.15s ease;
}

.bottom-nav__item--active {
  color: var(--color-accent);
}
</style>
