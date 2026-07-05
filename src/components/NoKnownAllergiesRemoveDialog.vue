<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="dialogTestId"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('noKnownAllergiesRemoveModalTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <p class="text-body1 no-known-allergies-remove-dialog__message">
          {{ t('noKnownAllergiesRemoveModalMessage') }}
        </p>
        <template v-if="requireDeletionReason">
          <p class="text-body2 q-mb-md q-mt-md">
            {{ t('allergyDeleteReasonHint') }}
          </p>
          <AddClientLabeledField
            required
            :label="t('allergyDeleteReasonLabel')">
            <q-input
              v-model="reason"
              outlined
              type="textarea"
              rows="3"
              counter
              maxlength="500"
              :data-testid="tid.allergyField('nka-deletion-reason')"
            />
          </AddClientLabeledField>
        </template>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="cancelTestId"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="confirmTestId"
          :disable="requireDeletionReason && !hasDeletionReason"
          :label="t('noKnownAllergiesRemoveModalConfirm')"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { addClientTestIds as tid, modalTestIds } from
  'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  requireDeletionReason: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const { t } = useI18n()

const reason = ref('')

const hasDeletionReason = computed(
  () => String(reason.value ?? '').trim().length > 0,
)

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const dialogTestId = modalTestIds.dialog('no-known-allergies-remove')
const cancelTestId = modalTestIds.cancel('no-known-allergies-remove')
const confirmTestId = modalTestIds.confirm('no-known-allergies-remove')

watch(
  () => props.modelValue,
  visible => {
    if (visible) {
      reason.value = ''
    }
  },
)

function onCancel() {
  emit('cancel')
  open.value = false
}

function onConfirm() {
  if (props.requireDeletionReason && !hasDeletionReason.value) {
    return
  }
  emit('confirm', String(reason.value ?? '').trim())
  open.value = false
}
</script>

<style scoped>
.no-known-allergies-remove-dialog__message {
  white-space: pre-line;
}
</style>
