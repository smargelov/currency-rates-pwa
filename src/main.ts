import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from '@/app/App.vue'
import { router } from '@/app/router'
import { captureInstallPrompt } from '@/features/install-app'
import '@/app/styles/global.css'

// The browser fires `beforeinstallprompt` right after load; keep it for the
// "Install app" button in Settings.
captureInstallPrompt()

// Service worker updates are applied silently on the next launch.
registerSW({ immediate: true })

createApp(App).use(createPinia()).use(router).mount('#app')
