<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="dialogTestId"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <div class="row q-col-gutter-md q-col-gutter-lg-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('fmhFamilyRelationship')"
              :test-id="tid.fmhField('relationship')">
              <FormSelect
                v-model="localRelationship"
                :test-id="tid.fmhField('relationship')"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :options="relationshipOptions"
                :error="Boolean(relationshipError)"
                :error-message="relationshipError"
              >
                <template #append>
                  <q-icon name="info_outline" class="cursor-pointer">
                    <q-tooltip>
                      {{ t('fmhRelationshipTooltip') }}
                    </q-tooltip>
                  </q-icon>
                </template>
              </FormSelect>
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('fmhMedicalConditions')"
              :test-id="tid.fmhField('conditions')">
              <q-input
                v-model="localConditions"
                outlined
                hide-bottom-space
                :data-testid="tid.fmhField('conditions')"
                :error="Boolean(conditionsError)"
                :error-message="conditionsError"
                maxlength="500"
              />
            </AddClientLabeledField>
          </div>
        </div>
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
          :label="t('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  isDuplicateFamilyMedicalHistoryEntry,
  trimFamilyMedicalField,
  validateFamilyMedicalHistoryForAdd,
} from 'src/utils/client-family-medical-history.js'
import {
  addClientTestIds as tid,
  modalTestIds,
} from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'edit',
  },
  entry: {
    type: Object,
    default: null,
  },
  entries: {
    type: Array,
    default: () => [],
  },
  relationshipOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()

const localRelationship = ref('')
const localConditions = ref('')
const relationshipError = ref('')
const conditionsError = ref('')
const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const dialogTitle = computed(() =>
  props.mode === 'edit'
    ? t('fmhEditTitle')
    : t('fmhEditTitle'),
)

const dialogTestId = modalTestIds.dialog('fmh-edit')
const cancelTestId = modalTestIds.cancel('fmh-edit')
const confirmTestId = modalTestIds.confirm('fmh-edit')

watch(
  () => props.modelValue,
  visible => {
    if (!visible) {
      return
    }
    relationshipError.value = ''
    conditionsError.value = ''
    localRelationship.value = props.entry?.familyRelationship ?? ''
    localConditions.value = props.entry?.medicalConditions ?? ''
  },
)

function onCancel() {
  open.value = false
}

function onSave() {
  relationshipError.value = ''
  conditionsError.value = ''
  const result = validateFamilyMedicalHistoryForAdd(
    localRelationship.value,
    localConditions.value,
  )
  if (!result.ok) {
    if (result.errorKey === 'fmhBothRequired') {
      relationshipError.value = t(result.errorKey)
      conditionsError.value = t(result.errorKey)
    } else if (result.errorKey === 'fmhRelationshipRequired') {
      relationshipError.value = t(result.errorKey)
    } else if (result.errorKey === 'fmhConditionsRequired') {
      conditionsError.value = t(result.errorKey)
    } else if (result.errorKey === 'fmhRelationshipMax') {
      relationshipError.value = t(result.errorKey, { max: 25 })
    } else if (result.errorKey === 'fmhConditionsInvalid') {
      conditionsError.value = t(result.errorKey, { max: 500 })
    }

    return
  }

  const excludeId = props.entry?.id ?? null
  if (
    isDuplicateFamilyMedicalHistoryEntry(
      props.entries,
      localRelationship.value,
      localConditions.value,
      excludeId,
    )
  ) {
    conditionsError.value = t('fmhDuplicateEntry')

    return
  }

  emit('save', {
    familyRelationship: trimFamilyMedicalField(localRelationship.value),
    medicalConditions: trimFamilyMedicalField(localConditions.value),
  })
  open.value = false
}
</script>

