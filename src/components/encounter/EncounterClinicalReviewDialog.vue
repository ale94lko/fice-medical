<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        test-id="encounter-clinical-review"
        :close-label="t('close')"
        @close="onCancel">
        {{ title }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ hint }}
        </p>
        <FormField :label="t('encounterReviewNotes')">
          <q-input
            v-model="notes"
            type="textarea"
            outlined
            autogrow
          />
        </FormField>
      </q-card-section>
      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          :data-testid="tid.clinicalReviewCancel"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :label="t('encounterReviewConfirm')"
          :data-testid="tid.clinicalReviewConfirm"
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
import FormField from 'components/FormField.vue'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'medication',
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t } = useI18n()
const notes = ref('')

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const title = computed(() =>
  props.mode === 'care-plan'
    ? t('encounterCarePlanReviewTitle')
    : t('encounterMedicationReviewTitle'),
)

const hint = computed(() =>
  props.mode === 'care-plan'
    ? t('encounterCarePlanReviewHint')
    : t('encounterMedicationReviewHint'),
)

watch(() => props.modelValue, (visible) => {
  if (visible) {
    notes.value = ''
  }
})

function onCancel() {
  open.value = false
}

function onConfirm() {
  emit('confirm', { notes: String(notes.value).trim() })
}
</script>
