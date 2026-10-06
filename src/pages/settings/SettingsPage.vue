<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRatesStore, type ProviderId } from '@/entities/rates'
import { useSettingsStore } from '@/entities/settings'
import { AppIcon, PageHeader } from '@/shared/ui'

const settings = useSettingsStore()
const rates = useRatesStore()

const APP_VERSION = __APP_VERSION__
const REPO_URL = 'https://github.com/smargelov/currency-rates-pwa'
const OXR_URL = 'https://openexchangerates.org/signup/free'

const providers: { id: ProviderId; title: string; description: string }[] = [
  {
    id: 'free',
    title: 'Free daily rates',
    description: 'No key needed. Updated once a day from a public source.',
  },
  {
    id: 'oxr',
    title: 'Open Exchange Rates',
    description: 'Hourly updates with your own free App ID (1,000 requests / month).',
  },
]

const keyDraft = ref(settings.apiKey)
const showKey = ref(false)
const keyDirty = computed(() => keyDraft.value.trim() !== settings.apiKey)

function saveKey() {
  settings.setApiKey(keyDraft.value)
}

const keyStatus = computed(() => {
  if (settings.provider !== 'oxr') return null
  if (!settings.hasApiKey) return { tone: 'warn', text: 'Enter an App ID to enable hourly rates.' }
  const error = rates.lastError
  if (error?.provider === 'oxr') {
    if (error.kind === 'unauthorized') return { tone: 'error', text: 'The App ID was rejected.' }
    if (error.kind === 'rate-limited')
      return { tone: 'error', text: 'Monthly request limit reached.' }
    return { tone: 'error', text: 'Could not reach Open Exchange Rates.' }
  }
  if (rates.current?.source === 'oxr')
    return { tone: 'ok', text: 'Connected. Rates update hourly.' }
  return null
})

const resetArmed = ref(false)

function resetApp() {
  if (!resetArmed.value) {
    resetArmed.value = true
    setTimeout(() => (resetArmed.value = false), 4000)
    return
  }
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('cr:'))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    // Storage unavailable — reloading is still the right outcome.
  }
  location.reload()
}
</script>

<template>
  <main class="settings">
    <PageHeader title="Settings" />

    <div class="settings__scroll">
      <section class="settings__section">
        <h2 class="settings__title">Rates source</h2>
        <div class="settings__card">
          <label
            v-for="provider in providers"
            :key="provider.id"
            class="option"
            :class="{ 'option--active': settings.provider === provider.id }"
          >
            <input
              type="radio"
              name="provider"
              class="option__input"
              :value="provider.id"
              :checked="settings.provider === provider.id"
              @change="settings.setProvider(provider.id)"
            />
            <span class="option__radio" aria-hidden="true" />
            <span class="option__text">
              <span class="option__title">{{ provider.title }}</span>
              <span class="option__description">{{ provider.description }}</span>
            </span>
          </label>
        </div>
      </section>

      <section v-if="settings.provider === 'oxr'" class="settings__section">
        <h2 class="settings__title">Open Exchange Rates App ID</h2>
        <div class="settings__card settings__card--padded">
          <div class="key-field">
            <input
              v-model="keyDraft"
              :type="showKey ? 'text' : 'password'"
              class="key-field__input"
              placeholder="Paste your App ID"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              aria-label="App ID"
              @keydown.enter="saveKey"
            />
            <button
              type="button"
              class="key-field__toggle"
              :aria-label="showKey ? 'Hide App ID' : 'Show App ID'"
              @click="showKey = !showKey"
            >
              <AppIcon :name="showKey ? 'eye-off' : 'eye'" :size="20" />
            </button>
          </div>
          <button type="button" class="settings__button" :disabled="!keyDirty" @click="saveKey">
            Save
          </button>
          <p
            v-if="keyStatus"
            class="settings__status"
            :class="`settings__status--${keyStatus.tone}`"
          >
            {{ keyStatus.text }}
          </p>
          <p class="settings__hint">
            The key is stored only in this browser and sent only to openexchangerates.org.
            <a :href="OXR_URL" target="_blank" rel="noopener">Get a free App ID</a>
          </p>
        </div>
      </section>

      <section class="settings__section">
        <h2 class="settings__title">About</h2>
        <div class="settings__card">
          <div class="about-row">
            <span>Version</span>
            <span class="about-row__value">{{ APP_VERSION }}</span>
          </div>
          <div class="about-row">
            <span>Rates by</span>
            <span class="about-row__value">
              {{
                rates.current?.source === 'oxr' ? 'Open Exchange Rates' : 'fawazahmed0/exchange-api'
              }}
            </span>
          </div>
          <a class="about-row about-row--link" :href="REPO_URL" target="_blank" rel="noopener">
            <span>Source code</span>
            <span class="about-row__value"><AppIcon name="external" :size="18" /></span>
          </a>
        </div>
      </section>

      <section class="settings__section">
        <button
          type="button"
          class="settings__danger"
          :class="{ 'settings__danger--armed': resetArmed }"
          @click="resetApp"
        >
          {{ resetArmed ? 'Tap again to confirm reset' : 'Reset app data' }}
        </button>
        <p class="settings__hint settings__hint--center">
          Clears your currency lists, API key and cached rates on this device.
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--nav-height) - var(--safe-bottom));
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
}

.settings__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--space-4) var(--space-4);
}

.settings__section {
  margin-bottom: var(--space-6);
}

.settings__title {
  margin: 0 0 var(--space-2) var(--space-1);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.settings__card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.settings__card--padded {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
}

.option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
}

.option + .option {
  border-top: 1px solid var(--color-border);
}

.option__input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.option__radio {
  flex: none;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border: 2px solid var(--color-text-muted);
  border-radius: 50%;
  transition: border-color 0.15s ease;
}

.option--active .option__radio {
  border-color: var(--color-accent);
  border-width: 7px;
}

.option__input:focus-visible + .option__radio {
  outline: 2px solid var(--color-border-active);
  outline-offset: 2px;
}

.option__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option__title {
  font-size: 16px;
  font-weight: 600;
}

.option__description {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.key-field {
  position: relative;
  display: flex;
}

.key-field__input {
  width: 100%;
  height: 48px;
  padding: 0 48px 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  font-family: var(--font-mono);
  font-size: 15px;
}

.key-field__toggle {
  position: absolute;
  right: var(--space-1);
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  border-radius: 50%;
}

.settings__button {
  align-self: flex-start;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 600;
}

.settings__button:disabled {
  opacity: 0.45;
  cursor: default;
}

.settings__status {
  margin: 0;
  font-size: 14px;
}

.settings__status--ok {
  color: var(--color-up);
}

.settings__status--warn {
  color: var(--color-warning);
}

.settings__status--error {
  color: var(--color-down);
}

.settings__hint {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.settings__hint a {
  color: var(--color-accent);
  text-decoration: underline;
}

.settings__hint--center {
  margin-top: var(--space-2);
  text-align: center;
}

.about-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  min-height: 52px;
  padding: var(--space-3) var(--space-4);
  font-size: 15px;
}

.about-row + .about-row {
  border-top: 1px solid var(--color-border);
}

.about-row__value {
  color: var(--color-text-secondary);
  text-align: right;
}

.about-row--link:active {
  background: var(--color-surface-2);
}

.settings__danger {
  width: 100%;
  height: 48px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-down);
  color: var(--color-down);
  font-weight: 600;
  transition: background-color 0.15s ease;
}

.settings__danger--armed {
  background: var(--color-down);
  color: #fff;
}
</style>
