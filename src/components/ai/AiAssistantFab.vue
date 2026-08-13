<template>
  <q-page-sticky
    v-if="visible"
    position="bottom-right"
    :offset="[24, 24]"
    class="ai-assistant-fab">
    <q-btn
      no-caps
      unelevated
      class="app-btn-ai ai-assistant-fab__btn"
      icon="auto_awesome"
      :disable="disable || generating"
      :loading="generating"
      :label="t('aiAssistantName')"
      :aria-label="t('aiAssistantName')"
      :data-testid="aiTestIds.featureBtn('clinical-summary')">
      <q-menu
        anchor="top right"
        self="bottom right"
        :offset="[0, 12]"
        class="ai-assistant-fab__menu">
        <div
          class="ai-assistant-fab__panel"
          :data-testid="aiTestIds.field('clinical-scope-menu')">
          <button
            v-for="option in scopeOptions"
            :key="option.value"
            v-close-popup
            type="button"
            class="ai-assistant-fab__option"
            :disabled="generating"
            :data-testid="aiTestIds.field(`scope-${option.value}`)"
            @click="onSelectScope(option.value)">
            <span
              class="ai-assistant-fab__option-icon"
              aria-hidden="true">
              <q-icon :name="option.icon" size="18px" />
            </span>
            <span class="ai-assistant-fab__option-label">
              {{ option.label }}
            </span>
            <q-icon
              name="chevron_right"
              size="18px"
              class="ai-assistant-fab__option-chevron"
            />
          </button>
        </div>
      </q-menu>
    </q-btn>

    <AiGenerateDialog
      v-model="reviewOpen"
      :feature="aiFeatures.clinicalSummary"
      :client-id="clientId"
      :initial-suggestion="suggestion"
    />
  </q-page-sticky>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AiGenerateDialog from 'components/ai/AiGenerateDialog.vue'
import {
  aiClinicalSummaryScopes,
  aiFeatures,
  quasarNotifyTypes,
} from 'components/constants.js'
import { aiTestIds } from 'src/test-ids/ai.js'
import {
  aiApiErrorMessage,
  generateClinicalSummary,
} from 'src/utils/ai-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { listClientEncounters } from 'src/utils/encounter-api.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
  disable: {
    type: Boolean,
    default: false,
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
})

const { t } = useI18n()
const $q = useQuasar()

const generating = ref(false)
const reviewOpen = ref(false)
const suggestion = ref(null)

const scopeOptions = computed(() => [
  {
    label: t('aiClinicalScopeFaceSheet'),
    value: aiClinicalSummaryScopes.faceSheetLite,
    icon: 'badge',
  },
  {
    label: t('aiClinicalScopeEncounter'),
    value: aiClinicalSummaryScopes.currentEncounter,
    icon: 'medical_services',
  },
  {
    label: t('aiClinicalScopeHistory'),
    value: aiClinicalSummaryScopes.recentHistory,
    icon: 'history',
  },
])

function encounterTimestamp(row) {
  const raw = row?.completedAtUtc
    || row?.startedAtUtc
    || row?.completedAt
    || row?.startedAt
    || ''
  const ts = Date.parse(raw)

  return Number.isFinite(ts) ? ts : 0
}

function pickLastEncounter(list) {
  if (!Array.isArray(list) || !list.length) {
    return null
  }

  return [...list].sort((a, b) => {
    const delta = encounterTimestamp(b) - encounterTimestamp(a)
    if (delta !== 0) {
      return delta
    }

    return Number(b.id || 0) - Number(a.id || 0)
  })[0]
}

async function resolveLastEncounterId() {
  const list = await listClientEncounters(props.clientId)

  return pickLastEncounter(list)?.id ?? null
}

async function onSelectScope(scope) {
  if (!props.clientId || generating.value) {
    return
  }
  generating.value = true
  try {
    const body = { scope }
    if (scope === aiClinicalSummaryScopes.currentEncounter) {
      const encounterId = await resolveLastEncounterId()
      if (encounterId == null) {
        $q.notify({
          type: quasarNotifyTypes.warning,
          message: t('aiLastEncounterMissing'),
        })

        return
      }
      body.encounterId = encounterId
    }
    if (scope === aiClinicalSummaryScopes.recentHistory) {
      body.historyDays = 90
    }
    suggestion.value = await generateClinicalSummary(
      props.clientId,
      body,
    )
    reviewOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: aiApiErrorMessage(error, t('aiGenerateError')),
      })
    }
  } finally {
    generating.value = false
  }
}
</script>

<style scoped lang="scss">
.ai-assistant-fab {
  z-index: 20;
}

.ai-assistant-fab__btn {
  min-height: 48px !important;
  height: 48px !important;
  max-height: 48px !important;
  padding-left: 18px !important;
  padding-right: 20px !important;
  border-radius: 999px !important;
  box-shadow: 0 8px 24px rgba(124, 92, 255, 0.35);
}

.ai-assistant-fab__menu {
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}

.ai-assistant-fab__panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 240px;
  padding: 8px;
  background: #fff;
}

.ai-assistant-fab__option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 10px 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: $text-strong;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    background: rgba($ai-accent, 0.08);
    outline: none;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.ai-assistant-fab__option-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 9px;
  background: rgba($ai-accent, 0.12);
  color: $ai-accent;
}

.ai-assistant-fab__option-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.25;
}

.ai-assistant-fab__option-chevron {
  flex-shrink: 0;
  color: $text-hint;
}
</style>
