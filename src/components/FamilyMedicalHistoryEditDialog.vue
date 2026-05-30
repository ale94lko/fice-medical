<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog">
      <q-toolbar class="q-px-md app-dialog-toolbar">
        <q-toolbar-title>{{ dialogTitle }}</q-toolbar-title>
      </q-toolbar>
      <q-card-section class="q-px-lg q-pt-md q-pb-sm">
        <div class="row q-col-gutter-md q-col-gutter-lg-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('fmhFamilyRelationship')">
              <q-select
                v-model="localRelationship"
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
              </q-select>
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('fmhMedicalConditions')">
              <q-input
                v-model="localConditions"
                outlined
                hide-bottom-space
                :error="Boolean(conditionsError)"
                :error-message="conditionsError"
                maxlength="500"
              />
            </AddClientLabeledField>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
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
          color="primary"
          class="app-btn-primary"
          :label="t('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  isDuplicateFamilyMedicalHistoryEntry,
  trimFamilyMedicalField,
  validateFamilyMedicalHistoryForAdd,
} from 'src/utils/client-family-medical-history.js'

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

<style lang="scss" scoped>
.family-medical-history-dialog {
  min-width: 520px;
  max-width: 720px;
  width: 100%;
}
</style>
