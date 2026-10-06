import { createRouter, createWebHistory } from 'vue-router'

export const routes = {
  converter: '/',
  allCurrencies: '/currencies',
  cryptoMetals: '/crypto-metals',
  settings: '/settings',
} as const

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: routes.converter,
      name: 'converter',
      component: () => import('@/pages/converter/ConverterPage.vue'),
    },
    {
      path: routes.allCurrencies,
      name: 'all-currencies',
      component: () => import('@/pages/all-currencies/AllCurrenciesPage.vue'),
    },
    {
      path: routes.cryptoMetals,
      name: 'crypto-metals',
      component: () => import('@/pages/crypto-metals/CryptoMetalsPage.vue'),
    },
    {
      path: routes.settings,
      name: 'settings',
      component: () => import('@/pages/settings/SettingsPage.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: routes.converter },
  ],
})
