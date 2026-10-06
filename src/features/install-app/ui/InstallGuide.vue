<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, type IconName } from '@/shared/ui'
import { useInstall, type InstallPlatform } from '../model/use-install'

const { platform, standalone, installed, canPrompt, promptInstall } = useInstall()

interface Step {
  text: string
  icon?: IconName
}

const tabs: { id: InstallPlatform; label: string }[] = [
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iPhone & iPad' },
  { id: 'desktop', label: 'Desktop' },
]

const steps: Record<InstallPlatform, Step[]> = {
  android: [
    { text: 'Open this site in Chrome.' },
    { text: 'Tap the menu button in the top-right corner.', icon: 'more-vertical' },
    { text: 'Choose "Add to Home screen" (on some phones: "Install app").', icon: 'download' },
    { text: 'Confirm — the icon appears on your home screen and opens full-screen.' },
  ],
  ios: [
    { text: 'Open this site in Safari — other browsers cannot install apps on iOS.' },
    { text: 'Tap the Share button in the toolbar.', icon: 'share-ios' },
    { text: 'Scroll down and tap "Add to Home Screen".', icon: 'plus' },
    { text: 'Tap "Add" in the top-right corner.' },
  ],
  desktop: [
    { text: 'Open this site in Chrome or Edge.' },
    { text: 'Click the install icon at the right end of the address bar.', icon: 'download' },
    { text: 'Or use the browser menu → "Install Currency Rates".' },
  ],
}

const isInstalled = computed(() => standalone.value || installed.value)
</script>

<template>
  <div class="install">
    <div v-if="isInstalled" class="install__done">
      <AppIcon name="check" :size="20" />
      <span>Installed on this device. You're using the app from the home screen.</span>
    </div>

    <template v-else>
      <button v-if="canPrompt" type="button" class="install__button" @click="promptInstall">
        <AppIcon name="download" :size="20" />
        Install app
      </button>

      <div class="install__tabs" role="tablist" aria-label="Platform">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          class="install__tab"
          :class="{ 'install__tab--active': platform === tab.id }"
          :aria-selected="platform === tab.id"
          @click="platform = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <ol class="install__steps">
        <li v-for="(step, index) in steps[platform]" :key="index" class="install__step">
          <span class="install__num">{{ index + 1 }}</span>
          <span class="install__text">
            {{ step.text }}
            <span v-if="step.icon" class="install__icon"
              ><AppIcon :name="step.icon" :size="16"
            /></span>
          </span>
        </li>
      </ol>
    </template>
  </div>
</template>

<style scoped>
.install {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
}

.install__done {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-up);
  font-size: 14px;
}

.install__done span {
  color: var(--color-text);
}

.install__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 44px;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 600;
}

.install__tabs {
  display: flex;
  padding: 3px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
}

.install__tab {
  flex: 1;
  height: 32px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.install__tab--active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
}

.install__steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.install__step {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  font-size: 14px;
  line-height: 1.45;
}

.install__num {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.install__text {
  padding-top: 1px;
}

.install__icon {
  display: inline-flex;
  vertical-align: -3px;
  margin-left: 2px;
  padding: 2px;
  border-radius: 4px;
  background: var(--color-surface-2);
  color: var(--color-text);
}
</style>
