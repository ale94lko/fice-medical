<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('appointmentEditTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <AddClientLabeledField
              :label="t('appointmentNotesOptional')"
              :test-id="tid.field('notes')">
              <q-input
                v-model="local.notes"
                outlined
                hide-bottom-space
                type="textarea"
                autogrow
                counter
                :maxlength="appointmentNotesMaxLength"
                :error="Boolean(errors.notes)"
                :error-message="errors.notes"
                :data-testid="tid.field('notes')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('appointmentReferralOptional')"
              :test-id="tid.field('referral')">
              <FormSelect
                v-model="local.referralId"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :options="referralOptions"
              />
            </AddClientLabeledField>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :label="t('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormSelect from 'components/FormSelect.vue'
import { appointmentNotesMaxLength } from 'components/constants.js'
import { listClientReferrals } from 'src/utils/appointment-api.js'
import { appointmentTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null },
  clientId: { type: [String, Number], default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const local = ref({ notes: '', referralId: null })
const errors = ref({})
const referralOptions = ref([])

watch(
  () => [props.modelValue, props.record],
  async() => {
    if (!props.modelValue || !props.record) {
      return
    }
    local.value = {
      notes: props.record.notes ?? '',
      referralId: props.record.referralId ?? null,
    }
    errors.value = {}
    if (props.clientId) {
      referralOptions.value = await listClientReferrals(props.clientId)
    }
  },
  { deep: true },
)

function onCancel() {
  open.value = false
  emit('cancel')
}

function onSave() {
  errors.value = {}
  if (local.value.notes.length > appointmentNotesMaxLength) {
    errors.value.notes = t('appointmentNotesMaxLength', {
      max: appointmentNotesMaxLength,
    })

    return
  }
  emit('save', buildEditPayload())
}

function buildEditPayload() {
  /* eslint-disable camelcase -- API PATCH payload */
  return {
    notes: local.value.notes || null,
    referral_id: local.value.referralId ?? null,
  }
  /* eslint-enable camelcase */
}
</script>
