import { computed, readonly, ref, shallowRef } from 'vue'

export type InstallPlatform = 'android' | 'ios' | 'desktop'

/** Chromium-only event; not in lib.dom yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Captured at app start (see `captureInstallPrompt`), because the browser
// fires it long before the Settings page is opened.
const deferredPrompt = shallowRef<BeforeInstallPromptEvent | null>(null)
const installed = ref(false)

/**
 * Must run once during app bootstrap so the Settings page can later offer a
 * one-tap "Install" button on Android / desktop Chromium.
 */
export function captureInstallPrompt(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt.value = event as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    installed.value = true
  })
}

export function detectPlatform(ua: string, maxTouchPoints = 0): InstallPlatform {
  if (/android/i.test(ua)) return 'android'
  // iPadOS 13+ reports itself as a Mac; touch points tell it apart.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)) return 'ios'
  return 'desktop'
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

/** Platform detection, installed state and the native install prompt when available. */
export function useInstall() {
  const platform = ref<InstallPlatform>(
    typeof navigator === 'undefined'
      ? 'desktop'
      : detectPlatform(navigator.userAgent, navigator.maxTouchPoints),
  )
  const standalone = ref(isStandalone())
  const canPrompt = computed(() => deferredPrompt.value !== null)

  async function promptInstall(): Promise<void> {
    const event = deferredPrompt.value
    if (!event) return
    await event.prompt()
    const { outcome } = await event.userChoice
    if (outcome === 'accepted') installed.value = true
    deferredPrompt.value = null
  }

  return {
    platform,
    standalone: readonly(standalone),
    installed: readonly(installed),
    canPrompt,
    promptInstall,
  }
}
