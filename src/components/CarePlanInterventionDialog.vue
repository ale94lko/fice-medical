<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card app-dialog-card--sm">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ t('carePlanInterventionSubtitle') }}
        </p>

        <SubsectionHeading
          icon="medical_services"
          :title="t('carePlanInterventionSection')"
        />

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12">
            <AddClientLabeledField
              :label="t('carePlanInterventionTitle')"
              required
              :test-id="tid.field('intervention-title')">
              <q-input
                v-model="local.title"
                outlined
                hide-bottom-space
                counter
                :readonly="readonly"
                :maxlength="carePlanGoalTitleMaxLength"
                :placeholder="t('carePlanInterventionTitlePlaceholder')"
                :error="Boolean(errors.title)"
                :error-message="errors.title"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('description')"
              :test-id="tid.field('intervention-description')">
              <q-input
                v-model="local.description"
                outlined
                hide-bottom-space
                type="textarea"
                autogrow
                counter
                :readonly="readonly"
                :maxlength="carePlanDescriptionMaxLength"
                :placeholder="t('carePlanInterventionDescriptionPlaceholder')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('carePlanInterventionFrequency')"
              required
              :test-id="tid.field('intervention-frequency')">
              <FormSelect
                v-model="local.frequency"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :readonly="readonly"
                :options="frequencyOptions"
                :placeholder="t('carePlanInterventionFrequencyPlaceholder')"
                :error="Boolean(errors.frequency)"
                :error-message="errors.frequency"
                :test-id="tid.field('intervention-frequency')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('carePlanInterventionClinician')"
              required
              :test-id="tid.field('intervention-clinician')">
              <FormSelect
                v-model="local.responsibleClinicianId"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :readonly="readonly"
                :options="clinicianOptions"
                :placeholder="t('carePlanClinicianPlaceholder')"
                :error="Boolean(errors.responsibleClinicianId)"
                :error-message="errors.responsibleClinicianId"
                :test-id="tid.field('intervention-clinician')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('notes')"
              :test-id="tid.field('intervention-notes')">
              <q-input
                v-model="local.notes"
                outlined
                hide-bottom-space
                type="textarea"
                rows="2"
                counter
                :readonly="readonly"
                :maxlength="carePlanInterventionNotesMaxLength"
                :placeholder="t('carePlanInterventionNotesPlaceholder')"
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
          :label="readonly ? t('close') : t('cancel')"
          @click="onCancel"
        />
        <template v-if="!readonly">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :label="t('carePlanAddIntervention')"
            @click="onSave"
          />
        </template>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import {
  carePlanDescriptionMaxLength,
  carePlanGoalTitleMaxLength,
  carePlanInterventionNotesMaxLength,
} from 'components/constants.js'
import {
  CARE_PLAN_FREQUENCY_OPTIONS,
  createEmptyIntervention,
} from 'src/utils/care-plan-orders.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  intervention: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'add',
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')
const local = ref(createEmptyIntervention())
const errors = reactive({})

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('carePlanInterventionViewTitle')
  }
  if (props.mode === 'edit') {
    return t('carePlanInterventionEditTitle')
  }

  return t('carePlanInterventionAddTitle')
})

const frequencyOptions = computed(() =>
  CARE_PLAN_FREQUENCY_OPTIONS.map(value => ({ label: value, value })),
)

watch(
  () => [props.modelValue, props.intervention],
  () => {
    if (props.modelValue) {
      local.value = {
        ...createEmptyIntervention(),
        ...(props.intervention ?? {}),
      }
      Object.keys(errors).forEach(key => delete errors[key])
    }
  },
  { immediate: true },
)

function validate() {
  Object.keys(errors).forEach(key => delete errors[key])
  if (!String(local.value.title ?? '').trim()) {
    errors.title = t('carePlanInterventionTitleRequired')
  }
  if (!local.value.frequency) {
    errors.frequency = t('carePlanInterventionFrequencyRequired')
  }
  if (!local.value.responsibleClinicianId) {
    errors.responsibleClinicianId = t('carePlanInterventionClinicianRequired')
  }

  return !Object.keys(errors).length
}

function onSave() {
  if (!validate()) {
    return
  }
  emit('save', { ...local.value })
  open.value = false
}

function onCancel() {
  emit('cancel')
  open.value = false
}
</script>
