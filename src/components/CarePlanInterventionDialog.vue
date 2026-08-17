<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        test-id="care-plan-intervention"
        :close-label="t('close')"
        :info="t('carePlanInterventionSubtitle')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
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
              <ClinicianFormSelect
                v-model="local.responsibleClinicianId"
                :readonly="readonly"
                :options="clinicianOptions"
                :placeholder="t('carePlanClinicianPlaceholder')"
                :error="Boolean(errors.responsibleClinicianId)"
                :error-message="errors.responsibleClinicianId"
                :test-id="tid.field('intervention-clinician')"
                @update:model-value="onClinicianChange"
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
          :data-testid="readonly ? tid.btn('close') : tid.btn('cancel')"
          @click="onCancel"
        />
        <template v-if="!readonly">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :label="t('carePlanAddIntervention')"
            :data-testid="tid.btn('save-intervention')"
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
import ClinicianFormSelect from 'components/ClinicianFormSelect.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import {
  carePlanDescriptionMaxLength,
  carePlanGoalTitleMaxLength,
  carePlanInterventionNotesMaxLength,
} from 'components/constants.js'
import {
  CARE_PLAN_FREQUENCY_OPTIONS,
  createEmptyIntervention,
  resolveClinicianOptionLabel,
  resolveDefaultResponsibleClinicianOption,
} from 'src/utils/care-plan-orders.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'
import { useAuthStore } from 'src/stores/auth-store.js'

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
const authStore = useAuthStore()

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

function applyDefaultResponsibleClinician() {
  if (props.mode !== 'add' || local.value.responsibleClinicianId) {
    return
  }
  const option = resolveDefaultResponsibleClinicianOption(
    props.clinicianOptions,
    { staffMember: authStore.userInfo?.staffMember ?? null },
  )
  if (!option) {
    return
  }
  local.value.responsibleClinicianId = option.value
  local.value.responsibleClinicianName = option.label || option.name || ''
}

function onClinicianChange(id) {
  local.value.responsibleClinicianName = resolveClinicianOptionLabel(
    props.clinicianOptions,
    id,
  )
}

watch(
  () => [props.modelValue, props.intervention, props.mode],
  () => {
    if (props.modelValue) {
      local.value = {
        ...createEmptyIntervention(),
        ...(props.intervention ?? {}),
      }
      applyDefaultResponsibleClinician()
      if (
        local.value.responsibleClinicianId
        && !String(local.value.responsibleClinicianName ?? '').trim()
      ) {
        onClinicianChange(local.value.responsibleClinicianId)
      }
      Object.keys(errors).forEach(key => delete errors[key])
    }
  },
  { immediate: true },
)

watch(
  () => props.clinicianOptions,
  () => {
    if (!open.value) {
      return
    }
    applyDefaultResponsibleClinician()
    if (
      local.value.responsibleClinicianId
      && !String(local.value.responsibleClinicianName ?? '').trim()
    ) {
      onClinicianChange(local.value.responsibleClinicianId)
    }
  },
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
  const clinicianName = String(local.value.responsibleClinicianName ?? '')
    .trim()
    || resolveClinicianOptionLabel(
      props.clinicianOptions,
      local.value.responsibleClinicianId,
    )
  emit('save', {
    ...local.value,
    responsibleClinicianName: clinicianName,
  })
  open.value = false
}

function onCancel() {
  emit('cancel')
  open.value = false
}
</script>
