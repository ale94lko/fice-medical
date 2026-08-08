<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog('lab-cancel')"
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog insurance-dialog--confirm
        app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('labCancelTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <p class="text-body1 q-mb-md">
          {{ t('labCancelMessage') }}
        </p>
        <p class="text-body2 q-mb-md">
          {{ t('labCancelReasonHint') }}
        </p>
        <AddClientLabeledField
          required
          :label="t('labCancelReasonLabel')">
          <q-input
            v-model="reason"
            outlined
            type="textarea"
            rows="3"
            counter
            maxlength="500"
            :data-testid="tid.field('cancel-reason')"
          />
        </AddClientLabeledField>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="modalTestIds.cancel('lab-cancel')"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="!hasReason"
          :data-testid="modalTestIds.confirm('lab-cancel')"
          :label="t('labCancelLab')"
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
import { labTestIds as tid, modalTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { t } = useI18n()

const reason = ref('')

const hasReason = computed(
  () => String(reason.value ?? '').trim().length > 0,
)

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

watch(
  () => props.modelValue,
  visible => {
    if (visible) {
      reason.value = ''
    }
  },
)

function onCancel() {
  open.value = false
}

function onConfirm() {
  if (!hasReason.value) {
    return
  }
  emit('confirm', String(reason.value ?? '').trim())
  open.value = false
}
</script>
