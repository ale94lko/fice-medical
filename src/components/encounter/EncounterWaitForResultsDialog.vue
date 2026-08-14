<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale"
    :data-testid="tid.waitDialog">
    <q-card
      class="insurance-dialog app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('encounterWaitTitle') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="encounter-wait-dialog__banner">
          {{ t('encounterWaitHint') }}
        </div>

        <AddClientLabeledField
          v-if="pendingLabs.length"
          required
          spaced
          :label="t('encounterWaitLabs')"
          :test-id="tid.waitLabs">
          <div class="encounter-wait-dialog__labs">
            <button
              v-for="lab in pendingLabs"
              :key="lab.id"
              type="button"
              class="encounter-wait-dialog__lab"
              :class="{
                'encounter-wait-dialog__lab--selected':
                  isLabSelected(lab.id),
              }"
              :data-testid="tid.waitLab(lab.id)"
              @click="toggleLab(lab.id)">
              <q-icon
                :name="isLabSelected(lab.id)
                  ? 'check_circle'
                  : 'radio_button_unchecked'"
                :color="isLabSelected(lab.id) ? 'positive' : 'grey-5'"
                size="22px"
              />
              <div class="encounter-wait-dialog__lab-body">
                <strong>
                  {{ lab.testName || t('encounterWaitUnnamedLab') }}
                </strong>
                <p class="text-caption text-grey-7 q-mb-none">
                  {{ labStatusLabel(lab.status) }}
                </p>
              </div>
            </button>
          </div>
        </AddClientLabeledField>
        <div
          v-else
          class="encounter-wait-dialog__empty">
          <q-icon name="science" size="32px" color="grey-6" />
          <p class="text-body1 text-grey-8 q-mb-xs">
            {{ t('encounterWaitNoPendingLabs') }}
          </p>
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ t('encounterWaitNoPendingLabsHint') }}
          </p>
        </div>

        <AddClientLabeledField
          required
          spaced
          :label="t('encounterWaitReason')">
          <q-input
            v-model="reason"
            type="textarea"
            outlined
            autogrow
            hide-bottom-space
            rows="3"
            :placeholder="t('encounterWaitReasonPlaceholder')"
            :data-testid="tid.waitReason"
          />
        </AddClientLabeledField>
      </q-card-section>
      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="warning"
          class="app-btn-primary"
          :disable="!canSubmit"
          :loading="saving"
          :label="t('encounterWaitConfirm')"
          :data-testid="tid.waitSubmit"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import { labStatuses } from 'components/constants.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'
import {
  canWaitForLabResult,
  labStatusToken,
} from 'src/utils/lab-orders.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  labs: {
    type: Array,
    default: () => [],
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { t } = useI18n()
const selectedIds = ref([])
const reason = ref('')

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const pendingLabs = computed(() =>
  (props.labs ?? []).filter(lab =>
    lab?.id != null && canWaitForLabResult(lab.status)),
)

const canSubmit = computed(() =>
  selectedIds.value.length > 0
    && String(reason.value ?? '').trim() !== '',
)

function isLabSelected(id) {
  return selectedIds.value.includes(id)
}

function toggleLab(id) {
  if (isLabSelected(id)) {
    selectedIds.value = selectedIds.value.filter(item => item !== id)

    return
  }
  selectedIds.value = [...selectedIds.value, id]
}

function labStatusLabel(status) {
  const token = labStatusToken(status)
  if (token === labStatuses.ordered) {
    return t('labStatusOrdered')
  }
  if (token === labStatuses.collected) {
    return t('labStatusCollected')
  }

  return token || '—'
}

function reset() {
  selectedIds.value = pendingLabs.value.map(lab => lab.id)
  reason.value = t('encounterWaitReasonDefault')
}

watch(() => props.modelValue, openNow => {
  if (openNow) {
    reset()
  }
})

function onCancel() {
  open.value = false
}

function onConfirm() {
  if (!canSubmit.value) {
    return
  }
  emit('confirm', {
    diagnosticOrderIds: [...selectedIds.value],
    reason: String(reason.value ?? '').trim(),
  })
}
</script>
