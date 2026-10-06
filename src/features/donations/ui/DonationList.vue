<script setup lang="ts">
import { ref } from 'vue'
import { AppIcon } from '@/shared/ui'
import { useDonations } from '../model/use-donations'
import type { DonationMethodId } from '../model/donation-methods'

// Loading is triggered by the page that decides whether to show the section.
const { methods } = useDonations()

const copiedId = ref<DonationMethodId | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

async function copy(id: DonationMethodId, value: string) {
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    // Clipboard API unavailable (insecure context / old WebView): fall back
    // to a transient textarea + execCommand.
    const area = document.createElement('textarea')
    area.value = value
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      document.execCommand('copy')
    } finally {
      area.remove()
    }
  }
  copiedId.value = id
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copiedId.value = null), 1600)
}
</script>

<template>
  <ul v-if="methods.length > 0" class="donations">
    <li v-for="method in methods" :key="method.id">
      <button
        type="button"
        class="donation"
        :class="{ 'donation--copied': copiedId === method.id }"
        :aria-label="`Copy ${method.title} ${method.subtitle} address`"
        @click="copy(method.id, method.value)"
      >
        <span class="donation__head">
          <span class="donation__title">{{ method.title }}</span>
          <span class="donation__subtitle">{{ method.subtitle }}</span>
          <span class="donation__action" aria-live="polite">
            <template v-if="copiedId === method.id">
              <AppIcon name="check" :size="16" /> Copied
            </template>
            <template v-else> <AppIcon name="copy" :size="16" /> Copy </template>
          </span>
        </span>
        <span class="donation__value">{{ method.value }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.donations {
  display: flex;
  flex-direction: column;
}

.donations li + li .donation {
  border-top: 1px solid var(--color-border);
}

.donation {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  transition: background-color 0.15s ease;
}

.donation:active {
  background: var(--color-surface-2);
}

.donation__head {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.donation__title {
  font-size: 15px;
  font-weight: 600;
}

.donation__subtitle {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.donation__action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-accent);
}

.donation--copied .donation__action {
  color: var(--color-up);
}

.donation__value {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-text-secondary);
  word-break: break-all;
}
</style>
