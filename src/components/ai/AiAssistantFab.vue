<template>
  <q-page-sticky
    v-if="visible"
    position="bottom-right"
    :offset="[24, 24]"
    class="ai-assistant-fab">
    <q-btn
      v-if="!open"
      no-caps
      unelevated
      class="app-btn-ai ai-assistant-fab__btn"
      icon="auto_awesome"
      :disable="disable"
      :label="t('aiAssistantName')"
      :aria-label="t('aiAssistantName')"
      :data-testid="aiTestIds.featureBtn('clinical-summary')"
      @click="open = true"
    />

    <div
      v-else
      class="ai-assistant-fab__chat"
      :data-testid="chartChatTestIds.panel">
      <div class="ai-assistant-fab__chat-header">
        <span
          class="ai-assistant-fab__chat-header-icon"
          aria-hidden="true">
          <q-icon name="auto_awesome" size="18px" />
        </span>
        <div class="ai-assistant-fab__chat-header-copy">
          <div class="ai-assistant-fab__chat-title">
            {{ t('aiAssistantName') }}
          </div>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          class="ai-assistant-fab__chat-close"
          :aria-label="t('close')"
          :data-testid="chartChatTestIds.close"
          @click="open = false"
        />
      </div>

      <div class="ai-assistant-fab__chat-body">
        <div
          ref="listEl"
          class="ai-assistant-fab__list"
          :data-testid="chartChatTestIds.list">
          <div
            v-for="(row, index) in messages"
            :key="index"
            class="ai-assistant-fab__turn"
            :class="row.role === 'user'
              ? 'ai-assistant-fab__turn--user'
              : 'ai-assistant-fab__turn--assistant'"
          >
            <component
              :is="row.suggestion ? 'button' : 'div'"
              class="ai-assistant-fab__bubble"
              :class="bubbleClass(row)"
              :type="row.suggestion ? 'button' : undefined"
              :data-testid="row.suggestion
                ? chartChatTestIds.openSummary(index)
                : undefined"
              @click="onOpenSummary(row)"
            >
              {{ row.text }}
            </component>
            <button
              v-if="row.section"
              type="button"
              class="ai-assistant-fab__section-link"
              :data-testid="chartChatTestIds.sectionLink(index)"
              @click.stop="onOpenSection(row.section)"
            >
              {{ sectionLinkLabel(row.section) }}
            </button>
          </div>
          <div
            v-if="busy"
            class="ai-assistant-fab__bubble
              ai-assistant-fab__bubble--assistant
              ai-assistant-fab__bubble--pending"
          >
            {{ t('chartChatThinking') }}
          </div>
        </div>
      </div>

      <div class="ai-assistant-fab__composer">
        <div
          v-if="canUseClinicalSummary"
          class="ai-assistant-fab__chips"
        >
          <button
            v-for="option in scopeOptions"
            :key="option.value"
            type="button"
            class="ai-assistant-fab__chip"
            :disabled="disable || busy"
            :data-testid="aiTestIds.field(`scope-${option.value}`)"
            @click="onSelectScope(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
        <div class="ai-assistant-fab__composer-row">
          <q-input
            v-model="draft"
            outlined
            dense
            autogrow
            class="col"
            :disable="busy || disable || !clientId"
            :placeholder="t('chartChatPlaceholder')"
            :data-testid="chartChatTestIds.input"
            @keydown.enter.exact.prevent="onSend"
          />
          <q-btn
            round
            unelevated
            class="app-btn-ai"
            icon="send"
            :loading="busy"
            :disable="!canSend"
            :aria-label="t('chartChatSend')"
            :data-testid="chartChatTestIds.send"
            @click="onSend"
          />
        </div>
      </div>
    </div>

    <AiGenerateDialog
      v-model="reviewOpen"
      :feature="reviewFeature"
      :client-id="clientId"
      :encounter-id="encounterId"
      :initial-suggestion="suggestion"
    />
  </q-page-sticky>
</template>

<script setup>
import { computed, nextTick, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AiGenerateDialog from 'components/ai/AiGenerateDialog.vue'
import {
  aiClinicalSummaryScopes,
  aiFeatures,
  quasarNotifyTypes,
} from 'components/constants.js'
import { useAiPermissions } from 'src/composables/useAiPermissions.js'
import { useClinicalSummaryGenerate } from
  'src/composables/useClinicalSummaryGenerate.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { aiTestIds, chartChatTestIds } from 'src/test-ids/ai.js'
import {
  aiApiErrorMessage,
  askChartChat,
} from 'src/utils/ai-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { chartChatSection } from 'src/utils/chart-chat-section.js'
import { staffGivenName } from 'src/utils/login-staff-member.js'

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
  encounterId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['open-chart-section'])

const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()
const { canUseClinicalSummary } = useAiPermissions()
const clientIdRef = toRef(props, 'clientId')
const {
  generating,
  reviewOpen,
  suggestion,
  generateByScope,
} = useClinicalSummaryGenerate(clientIdRef)

const open = ref(false)
const draft = ref('')
const sending = ref(false)
const messages = ref([])
const listEl = ref(null)
const reviewFeature = ref(aiFeatures.clinicalSummary)

const userFirstName = computed(() =>
  staffGivenName(
    authStore.linkedStaffProfile
    ?? authStore.userInfo?.staffMember,
  ),
)

const greeting = computed(() => {
  if (userFirstName.value) {
    return t('chartChatGreetingNamed', {
      name: userFirstName.value,
    })
  }

  return t('chartChatGreeting')
})

function greetingMessage() {
  return { role: 'assistant', text: greeting.value }
}

const scopeOptions = computed(() => [
  {
    label: t('chartChatChipEncounter'),
    value: aiClinicalSummaryScopes.currentEncounter,
  },
  {
    label: t('chartChatChipHistory'),
    value: aiClinicalSummaryScopes.recentHistory,
  },
])

const canSend = computed(() =>
  Boolean(props.clientId)
    && draft.value.trim()
    && !sending.value
    && !generating.value
    && !props.disable,
)

const busy = computed(() => sending.value || generating.value)

function bubbleClass(row) {
  return {
    'ai-assistant-fab__bubble--user': row.role === 'user',
    'ai-assistant-fab__bubble--assistant': row.role !== 'user',
    'ai-assistant-fab__bubble--action': Boolean(row.suggestion),
  }
}

function draftReadyText(feature) {
  if (feature === aiFeatures.soapDraft) {
    return t('chartChatDraftReadySoap')
  }
  if (feature === aiFeatures.icd10Suggest) {
    return t('chartChatDraftReadyIcd')
  }
  if (feature === aiFeatures.carePlanDraft) {
    return t('chartChatDraftReadyCarePlan')
  }

  return t('chartChatDraftReadySummary')
}

function summaryReadyText(scope) {
  if (scope === aiClinicalSummaryScopes.currentEncounter) {
    return t('chartChatSummaryReadyEncounter')
  }

  return t('chartChatSummaryReadyHistory')
}

async function pushMessage(row) {
  messages.value = [...messages.value, row]
  await scrollList()
}

function onOpenSummary(row) {
  if (!row?.suggestion) {
    return
  }
  reviewFeature.value = row.feature || aiFeatures.clinicalSummary
  suggestion.value = row.suggestion
  reviewOpen.value = true
}

function sectionLinkLabel(section) {
  return t('chartChatVerifySection', {
    section: t(section.labelKey),
  })
}

function onOpenSection(section) {
  if (!section) {
    return
  }
  emit('open-chart-section', section)
}

watch(
  () => props.clientId,
  () => {
    messages.value = [greetingMessage()]
    draft.value = ''
  },
)

watch(open, (isOpen) => {
  if (!isOpen) {
    return
  }
  const onlyGreeting = messages.value.length <= 1
    && messages.value.every(row => row.role === 'assistant')
  if (onlyGreeting) {
    messages.value = [greetingMessage()]
  }
})

async function onSelectScope(scope) {
  if (!props.clientId || props.disable || busy.value) {
    return
  }
  const option = scopeOptions.value.find(item => item.value === scope)
  await pushMessage({
    role: 'user',
    text: option?.label || '',
  })
  reviewFeature.value = aiFeatures.clinicalSummary
  const outcome = await generateByScope(scope)
  if (outcome?.suggestion) {
    await pushMessage({
      role: 'assistant',
      text: summaryReadyText(scope),
      suggestion: outcome.suggestion,
      feature: aiFeatures.clinicalSummary,
    })

    return
  }
  await pushMessage({
    role: 'assistant',
    text: t(outcome?.errorKey || 'aiGenerateError'),
  })
}

function onSend() {
  void sendText(draft.value)
}

function assistantMessage(result) {
  if (result?.suggestion) {
    return {
      role: 'assistant',
      text: draftReadyText(result.feature),
      suggestion: result.suggestion,
      feature: result.feature || aiFeatures.clinicalSummary,
    }
  }

  return {
    role: 'assistant',
    text: result?.answer || t('chartChatEmptyAnswer'),
    section: chartChatSection(result?.intent),
  }
}

async function scrollList() {
  await nextTick()
  const el = listEl.value
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}

async function sendText(raw) {
  const text = String(raw || '').trim()
  if (!text || sending.value || generating.value || !props.clientId) {
    return
  }
  messages.value = [
    ...messages.value,
    { role: 'user', text },
  ]
  draft.value = ''
  sending.value = true
  await scrollList()
  try {
    const result = await askChartChat(props.clientId, text, {
      encounterId: props.encounterId,
    })
    messages.value = [
      ...messages.value,
      assistantMessage(result),
    ]
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: aiApiErrorMessage(
          error,
          t('chartChatError'),
        ),
      })
    }
  } finally {
    sending.value = false
    await scrollList()
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

.ai-assistant-fab__chat {
  display: flex;
  flex-direction: column;
  width: min(300px, calc(100vw - 48px));
  max-height: min(640px, calc(100dvh - 96px));
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: 16px;
  background: $surface;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
}

.ai-assistant-fab__chat-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 12px 12px 14px;
  background: $ai-accent;
  color: $white;
}

.ai-assistant-fab__chat-header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.16);
  color: $white;
}

.ai-assistant-fab__chat-header-copy {
  flex: 1 1 auto;
  min-width: 0;
}

.ai-assistant-fab__chat-title {
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.25;
}

.ai-assistant-fab__chat-close {
  color: $white !important;
}

.ai-assistant-fab__chat-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
  padding: 12px 12px 0;
}

.ai-assistant-fab__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ai-assistant-fab__chip {
  margin: 0;
  padding: 5px 10px;
  border: 1px solid $border-subtle;
  border-radius: 999px;
  background: $surface-muted;
  color: $text-strong;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: rgba($ai-accent, 0.35);
    color: $ai-accent;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.ai-assistant-fab__list {
  flex: 1 1 auto;
  min-height: 180px;
  max-height: 280px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 2px 10px;
}

.ai-assistant-fab__turn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 88%;
}

.ai-assistant-fab__turn--user {
  align-self: flex-end;
  align-items: flex-end;
}

.ai-assistant-fab__turn--assistant {
  align-self: flex-start;
  align-items: flex-start;
}

.ai-assistant-fab__bubble {
  max-width: 88%;
  padding: 8px 12px;
  border-radius: 14px;
  font-size: 0.8125rem;
  line-height: 1.45;
  white-space: pre-wrap;
}

.ai-assistant-fab__turn .ai-assistant-fab__bubble {
  max-width: 100%;
}

.ai-assistant-fab__bubble--user {
  align-self: flex-end;
  border-bottom-right-radius: 4px;
  background: $ai-accent;
  color: $white;
}

.ai-assistant-fab__bubble--assistant {
  align-self: flex-start;
  border-bottom-left-radius: 4px;
  background: $surface-muted;
  color: $text-strong;
}

.ai-assistant-fab__bubble--pending {
  color: $text-muted;
  font-style: italic;
}

.ai-assistant-fab__bubble--action {
  margin: 0;
  border: 0;
  cursor: pointer;
  text-align: left;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  color: $ai-accent;
  background: rgba($ai-accent, 0.08);

  &:hover,
  &:focus-visible {
    background: rgba($ai-accent, 0.14);
    outline: none;
  }
}

.ai-assistant-fab__section-link {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: $ai-accent;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  text-align: left;

  &:hover,
  &:focus-visible {
    outline: none;
  }
}

.ai-assistant-fab__composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
  border-top: 1px solid $border-subtle;
}

.ai-assistant-fab__composer-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
</style>
