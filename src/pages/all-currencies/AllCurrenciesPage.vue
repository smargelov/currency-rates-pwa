<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CurrencyFlag,
  displayCode,
  getCurrency,
  listByType,
  searchCurrencies,
  type CurrencyMeta,
  type CurrencyType,
} from '@/entities/currency'
import { useSettingsStore } from '@/entities/settings'
import { useDebounced } from '@/shared/lib/use-debounced'
import { AppIcon, EmptyState, PageHeader } from '@/shared/ui'

type Target = 'main' | 'cm'

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()

/** Which list the picker edits: converter rows or the Crypto & Metals tab. */
const target = computed<Target>(() => (route.query.for === 'cm' ? 'cm' : 'main'))
const listKey = computed<'cryptoMetals' | 'selected'>(() =>
  target.value === 'cm' ? 'cryptoMetals' : 'selected',
)

const TABS: { type: CurrencyType; label: string }[] = [
  { type: 'fiat', label: 'Currencies' },
  { type: 'crypto', label: 'Crypto' },
  { type: 'metal', label: 'Metals' },
]
const tabs = computed(() => (target.value === 'cm' ? TABS.slice(1) : TABS))

function initialTab(): CurrencyType {
  const fromQuery = route.query.tab
  if (fromQuery === 'fiat' || fromQuery === 'crypto' || fromQuery === 'metal') return fromQuery
  return target.value === 'cm' ? 'crypto' : 'fiat'
}
const activeTab = ref<CurrencyType>(initialTab())

const SEARCH_DEBOUNCE_MS = 300

const query = ref('')
// Results follow the input with a short delay so each keystroke doesn't
// re-filter the whole catalog; clearing applies immediately.
const { debounced: searchTerm, flush: flushSearch } = useDebounced(query, SEARCH_DEBOUNCE_MS)
const searchInput = ref<HTMLInputElement | null>(null)

// Read the value straight from the event: Vue's v-model waits for the IME
// `compositionend`, which on Android keyboards only fires on "Done".
function onSearchInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value
}

function clearSearch() {
  query.value = ''
  flushSearch()
  searchInput.value?.focus()
}

const selectedCodes = computed(() => settings[listKey.value])

const selectedList = computed<CurrencyMeta[]>(() => {
  const codes =
    target.value === 'main' ? [settings.baseCode, ...settings.selected] : settings.cryptoMetals
  return codes.map(getCurrency).filter((meta): meta is CurrencyMeta => meta !== undefined)
})

const results = computed(() => searchCurrencies(searchTerm.value, listByType(activeTab.value)))

/** Alphabetical sections by first letter of the code, like the reference app. */
const sections = computed(() => {
  const groups = new Map<string, CurrencyMeta[]>()
  for (const meta of results.value) {
    const letter = meta.code[0]!.toUpperCase()
    const bucket = groups.get(letter) ?? []
    bucket.push(meta)
    groups.set(letter, bucket)
  }
  return [...groups.entries()].map(([letter, items]) => ({ letter, items }))
})

const showSelected = computed(() => searchTerm.value.trim() === '' && selectedList.value.length > 0)

function isBase(code: string) {
  return target.value === 'main' && code === settings.baseCode
}

function isSelected(code: string) {
  return isBase(code) || selectedCodes.value.includes(code)
}

function toggle(meta: CurrencyMeta) {
  if (isBase(meta.code)) return
  settings.toggle(listKey.value, meta.code)
}

function close() {
  if (window.history.length > 1) router.back()
  else void router.push(target.value === 'cm' ? '/crypto-metals' : '/')
}

onMounted(() => {
  // Desktop convenience; on phones autofocus would pop the keyboard over the list.
  if (window.matchMedia('(pointer: fine)').matches) searchInput.value?.focus()
})
</script>

<template>
  <main class="picker">
    <PageHeader title="All currencies" back />

    <div class="picker__search">
      <AppIcon name="search" :size="22" class="picker__search-icon" />
      <input
        ref="searchInput"
        :value="query"
        type="search"
        class="picker__search-input"
        placeholder="Search"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="done"
        aria-label="Search currencies"
        @input="onSearchInput"
        @keydown.enter="flushSearch"
      />
      <button
        v-if="query"
        type="button"
        class="picker__search-clear"
        aria-label="Clear search"
        @click="clearSearch"
      >
        ×
      </button>
    </div>

    <div class="picker__tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.type"
        type="button"
        role="tab"
        class="picker__tab"
        :class="{ 'picker__tab--active': activeTab === tab.type }"
        :aria-selected="activeTab === tab.type"
        @click="activeTab = tab.type"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="picker__scroll">
      <section v-if="showSelected" class="picker__section">
        <h2 class="picker__section-title">Selected</h2>
        <ul class="picker__list">
          <li v-for="meta in selectedList" :key="`sel-${meta.code}`">
            <button
              type="button"
              class="picker__item"
              :class="{ 'picker__item--base': isBase(meta.code) }"
              :aria-pressed="true"
              :disabled="isBase(meta.code)"
              @click="toggle(meta)"
            >
              <CurrencyFlag :currency="meta" size="sm" />
              <span class="picker__item-text">
                <span class="picker__item-code">{{ displayCode(meta.code) }}</span>
                <span class="picker__item-name">{{ meta.name }}</span>
              </span>
              <span class="picker__item-mark">
                <AppIcon v-if="isBase(meta.code)" name="shield" :size="20" />
                <span v-else class="picker__dot" />
              </span>
            </button>
          </li>
        </ul>
      </section>

      <section v-for="section in sections" :key="section.letter" class="picker__section">
        <h2 class="picker__section-title">{{ section.letter }}</h2>
        <ul class="picker__list">
          <li v-for="meta in section.items" :key="meta.code">
            <button
              type="button"
              class="picker__item"
              :aria-pressed="isSelected(meta.code)"
              :disabled="isBase(meta.code)"
              @click="toggle(meta)"
            >
              <CurrencyFlag :currency="meta" size="sm" />
              <span class="picker__item-text">
                <span class="picker__item-code">{{ displayCode(meta.code) }}</span>
                <span class="picker__item-name">{{ meta.name }}</span>
              </span>
              <span class="picker__item-mark">
                <AppIcon v-if="isBase(meta.code)" name="shield" :size="20" />
                <span v-else-if="isSelected(meta.code)" class="picker__dot" />
              </span>
            </button>
          </li>
        </ul>
      </section>

      <EmptyState
        v-if="sections.length === 0"
        icon="search"
        title="Nothing found"
        :description="`No ${activeTab === 'fiat' ? 'currencies' : activeTab === 'crypto' ? 'cryptocurrencies' : 'metals'} match “${searchTerm}”.`"
      />
    </div>

    <div class="picker__footer">
      <button type="button" class="picker__done" @click="close">
        <AppIcon name="check" :size="20" />
        Done
      </button>
    </div>
  </main>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
}

.picker__search {
  position: relative;
  display: flex;
  align-items: center;
  margin: 0 var(--space-4) var(--space-3);
}

.picker__search-icon {
  position: absolute;
  left: var(--space-4);
  color: var(--color-text-muted);
  pointer-events: none;
}

.picker__search-input {
  width: 100%;
  height: 52px;
  padding: 0 44px 0 52px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: 17px;
  -webkit-appearance: none;
  appearance: none;
}

.picker__search-input::-webkit-search-cancel-button {
  display: none;
}

.picker__search-input::placeholder {
  color: var(--color-text-muted);
}

.picker__search-clear {
  position: absolute;
  right: var(--space-2);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: var(--color-text-secondary);
  font-size: 22px;
  line-height: 1;
}

.picker__tabs {
  display: flex;
  gap: var(--space-5);
  padding: 0 var(--space-4) var(--space-3);
}

.picker__tab {
  padding: var(--space-1) 0;
  font-size: 17px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
}

.picker__tab--active {
  color: var(--color-text);
  border-bottom-color: var(--color-accent);
}

.picker__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--space-4) var(--space-4);
}

.picker__section-title {
  margin: var(--space-3) 0 var(--space-1);
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.picker__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 64px;
  padding: var(--space-2) var(--space-1);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.picker__item:disabled {
  cursor: default;
}

.picker__item-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.picker__item-code {
  font-size: 18px;
  font-weight: 600;
}

.picker__item-name {
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker__item-mark {
  display: inline-flex;
  width: 24px;
  justify-content: center;
  color: var(--color-accent);
}

.picker__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
}

.picker__footer {
  padding: var(--space-2) var(--space-4) calc(var(--space-3) + var(--safe-bottom));
  background: var(--color-bg);
  box-shadow: var(--shadow-sheet);
}

.picker__done {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 17px;
  font-weight: 600;
}
</style>
