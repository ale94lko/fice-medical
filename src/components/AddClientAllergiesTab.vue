<template>
  <div class="add-client-allergies-tab">
    <section class="add-client-form__section">
      <div class="add-client-form__fields">
        <q-expansion-item
          v-model="section.addExpanded"
          expand-separator
          class="add-client-form__allergy-add-expansion"
          header-class="add-client-form__allergy-add-header"
          :label="t('allergiesAddSectionTitle')"
          icon="add_circle_outline"
        >
          <div class="add-client-form__allergy-add-card q-pa-md">
            <div
              class="row q-col-gutter-md q-col-gutter-lg-md
                add-client-form__allergy-input-row">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="section.draft.allergy"
                  outlined
                  hide-bottom-space
                  :label="t('allergyName')"
                  :error="Boolean(draftNameError)"
                  :error-message="draftNameError"
                  maxlength="100"
                />
              </div>
              <div class="col-12 col-md-6">
                <ClientYearField
                  v-model="section.draft.startYear"
                  :label="t('allergyStartYear')"
                  :min-year="allergyMinStartYear()"
                  :max-year="allergyMaxStartYear()"
                  :error="Boolean(draftYearError)"
                  :error-message="draftYearError"
                  :close-label="t('close')"
                />
                <p
                  v-if="!draftYearError"
                  class="add-client-form__allergy-year-hint">
                  {{ startYearHint }}
                </p>
              </div>
              <div class="col-12">
                <div class="text-caption text-grey-8 q-mb-sm">
                  {{ t('allergySeverity') }}
                </div>
                <div class="add-client-form__allergy-severity-grid">
                  <q-btn
                    v-for="opt in severityOptions"
                    :key="opt.value"
                    no-caps
                    :outline="section.draft.severity !== opt.value"
                    :unelevated="section.draft.severity === opt.value"
                    :class="[
                      'add-client-form__allergy-severity-chip',
                      `add-client-form__allergy-severity-chip--${opt.modifier}`,
                      {
                        'add-client-form__allergy-severity-chip--selected':
                          section.draft.severity === opt.value,
                      },
                    ]"
                    @click="section.draft.severity = opt.value">
                    <span
                      :class="severityDotClass(opt.modifier)"
                    />
                    <span class="add-client-form__allergy-severity-label">
                      {{ opt.label }}
                    </span>
                  </q-btn>
                </div>
                <div
                  v-if="draftSeverityError"
                  class="text-negative text-caption q-mt-xs">
                  {{ draftSeverityError }}
                </div>
              </div>
              <div class="col-12 flex justify-end">
                <q-btn
                  no-caps
                  unelevated
                  color="primary"
                  class="app-btn-primary"
                  icon="add"
                  :label="t('allergyAdd')"
                  @click="onAddEntry"
                />
              </div>
            </div>
          </div>
        </q-expansion-item>
      </div>
    </section>

    <q-separator class="q-my-lg" />

    <section class="add-client-form__section">
      <AddClientSectionHeading
        icon="medical_services"
        :title="t('allergiesExistingTitle')"
      />
      <div class="add-client-form__fields">
        <div class="add-client-form__fmh-list-card q-pa-md">
          <AllergiesTable
            :entries="section.entries"
            :empty-label="t('allergiesExistingEmpty')"
            @edit="openEdit"
            @delete="openDelete"
          />
        </div>
        <p class="add-client-form__allergy-footer-hint">
          <q-icon name="info_outline" size="18px" class="q-mr-xs" />
          {{ t('allergiesFooterHint') }}
        </p>
      </div>
    </section>

    <AllergyEditDialog
      v-model="editDialogOpen"
      :entry="editingEntry"
      :entries="section.entries"
      @save="onEditSave"
    />

    <AllergyDeleteDialog
      v-model="deleteDialogOpen"
      @confirm="onDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import ClientYearField from 'components/ClientYearField.vue'
import AddClientSectionHeading from 'components/AddClientSectionHeading.vue'
import AllergiesTable from 'components/AllergiesTable.vue'
import AllergyEditDialog from 'components/AllergyEditDialog.vue'
import AllergyDeleteDialog from 'components/AllergyDeleteDialog.vue'
import {
  clientAllergySeverityValues,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  allergyMaxStartYear,
  allergyMinStartYear,
  createEmptyAllergyDraft,
  isDuplicateAllergyEntry,
  nextAllergyId,
  trimAllergyField,
  validateAllergyForAdd,
} from 'src/utils/client-allergies.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()

const draftNameError = ref('')
const draftSeverityError = ref('')
const draftYearError = ref('')
const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editingEntry = ref(null)
const deletingEntry = ref(null)

const severityOptions = [
  {
    value: clientAllergySeverityValues.mild,
    label: clientAllergySeverityValues.mild,
    modifier: 'mild',
  },
  {
    value: clientAllergySeverityValues.moderate,
    label: clientAllergySeverityValues.moderate,
    modifier: 'moderate',
  },
  {
    value: clientAllergySeverityValues.severe,
    label: clientAllergySeverityValues.severe,
    modifier: 'severe',
  },
]

const section = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const startYearHint = computed(() =>
  t('allergyStartYearHint', {
    min: allergyMinStartYear(),
    max: allergyMaxStartYear(),
  }),
)

function severityDotClass(modifier) {
  return [
    'add-client-form__allergy-severity-dot',
    `add-client-form__allergy-severity-dot--${modifier}`,
  ]
}

function notifySuccess(message) {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message,
    position: 'top',
  })
}

function notifyError(message) {
  $q.notify({
    type: quasarNotifyTypes.negative,
    message,
    position: 'top',
  })
}

function applyDraftErrors(result) {
  draftNameError.value = ''
  draftSeverityError.value = ''
  draftYearError.value = ''
  if (!result.ok && result.errorKey) {
    if (
      result.errorKey === 'allergyNameRequired'
      || result.errorKey === 'allergyNameInvalid'
      || result.errorKey === 'allergyAddRequired'
    ) {
      draftNameError.value = t(result.errorKey, { max: 100 })
    } else if (result.errorKey === 'allergySeverityRequired') {
      draftSeverityError.value = t(result.errorKey)
    } else if (result.errorKey === 'allergyStartYearInvalid') {
      draftYearError.value = t(result.errorKey, {
        min: allergyMinStartYear(),
        max: allergyMaxStartYear(),
      })
    }
  }
}

function onAddEntry() {
  draftNameError.value = ''
  draftSeverityError.value = ''
  draftYearError.value = ''

  const draft = section.value.draft
  const result = validateAllergyForAdd(
    draft.allergy,
    draft.severity,
    draft.startYear,
  )
  if (!result.ok) {
    applyDraftErrors(result)
    notifyError(t(result.errorKey, {
      min: allergyMinStartYear(),
      max: allergyMaxStartYear(),
      maxName: 100,
    }))

    return
  }

  const allergy = trimAllergyField(draft.allergy)
  const severity = trimAllergyField(draft.severity)
  const yearRaw = trimAllergyField(draft.startYear)

  if (
    isDuplicateAllergyEntry(
      section.value.entries,
      allergy,
      severity,
      yearRaw,
    )
  ) {
    draftNameError.value = t('allergyDuplicateEntry')
    notifyError(t('allergyDuplicateEntry'))

    return
  }

  section.value.entries.push({
    id: nextAllergyId(),
    allergy,
    severity,
    startYear: yearRaw === '' ? null : Number(yearRaw),
  })
  section.value.draft = createEmptyAllergyDraft()
  notifySuccess(t('allergyAddedSuccess'))
}

function openEdit(entry) {
  editingEntry.value = { ...entry }
  editDialogOpen.value = true
}

function onEditSave(payload) {
  const index = section.value.entries.findIndex(
    e => e.id === editingEntry.value?.id,
  )
  if (index < 0) {
    return
  }
  section.value.entries[index] = {
    ...section.value.entries[index],
    ...payload,
  }
  notifySuccess(t('allergyUpdatedSuccess'))
}

function openDelete(entry) {
  deletingEntry.value = entry
  deleteDialogOpen.value = true
}

function onDeleteConfirm(reason) {
  const entry = deletingEntry.value
  if (!entry?.id) {
    return
  }
  const index = section.value.entries.findIndex(e => e.id === entry.id)
  if (index >= 0) {
    if (!section.value.deletionAudit) {
      section.value.deletionAudit = []
    }
    section.value.deletionAudit.push({
      allergy: entry.allergy,
      severity: entry.severity,
      startYear: entry.startYear,
      reason: String(reason ?? '').trim(),
    })
    section.value.entries.splice(index, 1)
    notifySuccess(t('allergyDeletedSuccess'))
  }
  deletingEntry.value = null
}
</script>
