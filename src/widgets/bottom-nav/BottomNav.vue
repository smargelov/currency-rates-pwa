<script setup lang="ts">
import { routes } from '@/app/router'

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
      <svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <template v-if="item.icon === 'home'">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v10h14V10" />
          <path d="M10 20v-6h4v6" />
        </template>
        <template v-else-if="item.icon === 'coins'">
          <circle cx="9" cy="9" r="6" />
          <path d="M14.2 6.3A6 6 0 1 1 6.3 14.2" />
        </template>
        <template v-else>
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
          />
        </template>
      </svg>
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
