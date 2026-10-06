<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import BottomNav from '@/widgets/bottom-nav/BottomNav.vue'
import { useRatesRefreshLifecycle } from '@/features/refresh-rates'

const route = useRoute()
// The picker is a full-screen flow pushed on top of a tab; it hides the nav.
const showNav = computed(() => route.name !== 'all-currencies')

useRatesRefreshLifecycle()
</script>

<template>
  <div class="app" :class="{ 'app--with-nav': showNav }">
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
    <BottomNav v-if="showNav" />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.app--with-nav {
  padding-bottom: calc(var(--nav-height) + var(--safe-bottom));
}
</style>
