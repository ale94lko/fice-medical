<template>
  <div
    class="ai-suggestion-review-panel"
    :data-testid="aiTestIds.reviewPanel">
    <div
      class="ai-suggestion-review-panel__framing q-mb-md"
      :data-testid="aiTestIds.framingBanner">
      <q-icon name="psychology" size="sm" />
      <div>
        <div class="text-weight-medium">
          {{ t('aiSuggestionFraming') }}
        </div>
        <div class="text-caption text-grey-7">
          {{ t('aiSuggestionFramingHint') }}
        </div>
      </div>
    </div>

    <div class="row items-center q-gutter-sm q-mb-md">
      <q-badge
        color="primary"
        :data-testid="aiTestIds.statusBadge">
        {{ statusLabel }}
      </q-badge>
      <q-badge
        v-if="suggestion.committedToRecordAt"
        color="positive"
        :data-testid="aiTestIds.committedBadge">
        {{ t('aiAlreadyInChart') }}
      </q-badge>
      <q-badge outline color="grey-7">
        {{ t('aiDraftForReview') }}
      </q-badge>
    </div>

    <AiSuggestionResultEditor
      v-model="draftResult"
      v-model:selected-paths="selectedPaths"
      :feature="suggestion.feature"
      :readonly="!canEdit || readonly"
    />

    <div
      v-if="canAct"
      class="row justify-end q-gutter-sm q-mt-lg">
      <q-btn
        v-if="canEdit && dirty"
        no-caps
        outline
        color="primary"
        class="app-btn-outline"
        :loading="saving"
        :disable="busy"
        :data-testid="aiTestIds.btnEdit"
        :label="t('aiSaveEdits')"
        @click="onSaveEdits"
      />
      <q-btn
        no-caps
        outline
        color="negative"
        class="app-btn-outline"
        :disable="busy || isTerminal"
        :data-testid="aiTestIds.btnReject"
        :label="t('aiReject')"
        @click="rejectOpen = true"
      />
      <q-btn
        no-caps
        unelevated
        color="primary"
        class="app-btn-primary"
        :loading="saving"
        :disable="busy || isTerminal"
        :data-testid="aiTestIds.btnAccept"
        :label="t('aiAccept')"
        @click="onAccept(false)"
      />
      <q-btn
        v-if="allowsCommit"
        no-caps
        unelevated
        color="primary"
        class="app-btn-primary"
        :loading="saving"
        :disable="busy || isTerminal || Boolean(
          suggestion.committedToRecordAt,
        )"
        :data-testid="aiTestIds.btnAcceptCommit"
        :label="t('aiAcceptAndCommit')"
        @click="commitConfirmOpen = true"
      />
    </div>

    <ModalComponent
      v-model="commitConfirmOpen"
      :title="t('aiCommitConfirmTitle')"
      :message="t('aiCommitConfirmMessage')"
      :confirm-text="t('aiAcceptAndCommit')"
      :cancel-text="t('cancel')"
      :test-id="aiTestIds.commitConfirm"
      @confirm="onAccept(true)"
    />

    <q-dialog
      v-model="rejectOpen"
      persistent
      transition-show="scale"
      transition-hide="scale">
      <q-card class="insurance-dialog app-dialog-card">
        <AppDialogHeader
          :test-id="aiTestIds.rejectDialog"
          :close-label="t('close')"
          @close="rejectOpen = false">
          {{ t('aiRejectTitle') }}
        </AppDialogHeader>
        <q-card-section
          class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
          <p class="text-body2 text-grey-7 q-mb-md">
            {{ t('aiRejectHint') }}
          </p>
          <FormField :label="t('aiRejectReason')" required>
            <q-input
              v-model="rejectReason"
              type="textarea"
              outlined
              autogrow
              :data-testid="aiTestIds.rejectReason"
            />
          </FormField>
        </q-card-section>
        <q-card-actions
          align="right"
          class="app-dialog-card__actions">
          <q-btn
            no-caps
            flat
            class="app-btn-outline"
            :label="t('cancel')"
            :data-testid="aiTestIds.rejectCancel"
            @click="rejectOpen = false"
          />
          <q-btn
            no-caps
            unelevated
            color="negative"
            class="app-btn-primary"
            :disable="!rejectReason.trim()"
            :label="t('aiReject')"
            :data-testid="aiTestIds.rejectConfirm"
            @click="onReject"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormField from 'components/FormField.vue'
import ModalComponent from 'components/ModalComponent.vue'
import AiSuggestionResultEditor from
  'components/ai/AiSuggestionResultEditor.vue'
import { aiFeatures } from 'components/constants.js'
import { aiTestIds } from 'src/test-ids/index.js'
import {
  cloneAiResult,
  featureAllowsCommit,
  isTerminalSuggestionStatus,
  normalizeIcdSuggestions,
} from 'src/utils/ai-normalize.js'

const props = defineProps({
  suggestion: {
    type: Object,
    required: true,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  canAct: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['save-edits', 'accept', 'reject'])

const { t } = useI18n()
const draftResult = ref(cloneAiResult(props.suggestion?.result))
const selectedPaths = ref([])
const baselineJson = ref('')
const rejectOpen = ref(false)
const rejectReason = ref('')
const commitConfirmOpen = ref(false)

const busy = computed(() => props.saving)

const isTerminal = computed(() =>
  isTerminalSuggestionStatus(props.suggestion?.status),
)

const allowsCommit = computed(() =>
  featureAllowsCommit(props.suggestion?.feature),
)

const dirty = computed(() =>
  JSON.stringify(draftResult.value) !== baselineJson.value,
)

const statusLabel = computed(() => {
  const status = String(props.suggestion?.status || '')
    .toUpperCase()
  const map = {
    PENDING: 'aiStatusPending',
    EDITED: 'aiStatusEdited',
    PARTIALLY_ACCEPTED: 'aiStatusPartiallyAccepted',
    ACCEPTED: 'aiStatusAccepted',
    REJECTED: 'aiStatusRejected',
    FAILED: 'aiStatusFailed',
    EXPIRED: 'aiStatusExpired',
  }
  const key = map[status]

  return key ? t(key) : (props.suggestion?.status || '—')
})

watch(
  () => props.suggestion,
  (next) => {
    draftResult.value = cloneAiResult(next?.result)
    baselineJson.value = JSON.stringify(draftResult.value)
    if (next?.feature === aiFeatures.icd10Suggest) {
      selectedPaths.value = normalizeIcdSuggestions(next.result)
        .map(item => item.path)
    } else {
      selectedPaths.value = []
    }
  },
  { immediate: true, deep: true },
)

function onSaveEdits() {
  emit('save-edits', cloneAiResult(draftResult.value))
}

function onAccept(commitToRecord) {
  commitConfirmOpen.value = false
  const payload = {
    commitToRecord: commitToRecord === true,
    editedResult: cloneAiResult(draftResult.value),
  }
  if (props.suggestion?.feature === aiFeatures.icd10Suggest) {
    payload.acceptedPaths = [...selectedPaths.value]
  }
  emit('accept', payload)
}

function onReject() {
  const reason = rejectReason.value.trim()
  if (!reason) {
    return
  }
  rejectOpen.value = false
  emit('reject', reason)
  rejectReason.value = ''
}
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables';

.ai-suggestion-review-panel__framing {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba($ai-accent, 0.08);
  border: 1px solid rgba($ai-accent, 0.22);
}
</style>
