<template>
  <div class="add-client-allergies-tab">
    <AddClientAccordionSection
      v-model="section.addExpanded"
      icon="add_circle_outline"
      :title="t('allergiesAddSectionTitle')">
      <div
        class="row q-col-gutter-sm q-col-gutter-md
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
    </AddClientAccordionSection>

    <q-separator class="add-client-form__section-separator" />

    <AddClientAccordionSection
      icon="medical_services"
      :title="t('allergiesExistingTitle')">
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
    </AddClientAccordionSection>

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
import AddClientAccordionSection from 'components/AddClientAccordionSection.vue'
import AllergiesTable from 'components/AllergiesTable.vue'
import AllergyEditDialog from 'components/AllergyEditDialog.vue'
import AllergyDeleteDialog from 'components/AllergyDeleteDialog.vue'
import {
  clientAllergyMaxNameLength,
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

const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editingEntry = ref(null)
const deletingEntryId = ref(null)
const draftNameError = ref('')
const draftYearError = ref('')
const draftSeverityError = ref('')

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

function applyDraftErrors(result) {
  draftNameError.value = ''
  draftYearError.value = ''
  draftSeverityError.value = ''
  if (!result.ok && result.errorKey) {
    if (
      result.errorKey === 'allergyNameRequired'
      || result.errorKey === 'allergyNameInvalid'
      || result.errorKey === 'allergyAddRequired'
    ) {
      draftNameError.value = t(result.errorKey, {
        maxName: clientAllergyMaxNameLength,
      })
    } else if (result.errorKey === 'allergySeverityRequired') {
      draftSeverityError.value = t(result.errorKey)
    } else if (result.errorKey === 'allergyStartYearInvalid') {
      draftYearError.value = t(result.errorKey, {
        min: allergyMinStartYear(),
        max: allergyMaxStartYear(),
      })
    } else {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t(result.errorKey),
        position: 'top',
      })
    }
  }
}

function onAddEntry() {
  const draft = section.value.draft
  const result = validateAllergyForAdd(
    draft.allergy,
    draft.severity,
    draft.startYear,
  )
  if (!result.ok) {
    applyDraftErrors(result)

    return
  }

  const allergyRaw = trimAllergyField(draft.allergy)
  const severityRaw = trimAllergyField(draft.severity)
  const yearRaw = trimAllergyField(draft.startYear)
  if (
    isDuplicateAllergyEntry(
      section.value.entries,
      allergyRaw,
      severityRaw,
      yearRaw,
    )
  ) {
    draftNameError.value = t('allergyDuplicateEntry')

    return
  }

  section.value.entries.push({
    id: nextAllergyId(),
    allergy: allergyRaw,
    severity: severityRaw,
    startYear: yearRaw === '' ? null : Number(yearRaw),
  })
  section.value.draft = createEmptyAllergyDraft()
  applyDraftErrors({ ok: true })
  notifySuccess(t('allergyAddedSuccess'))
}

function openEdit(entry) {
  editingEntry.value = { ...entry }
  editDialogOpen.value = true
}

function onEditSave(updated) {
  const index = section.value.entries.findIndex(
    e => e.id === updated.id,
  )
  if (index < 0) {
    return
  }
  section.value.entries[index] = { ...updated }
  notifySuccess(t('allergyUpdatedSuccess'))
}

function openDelete(entry) {
  deletingEntryId.value = entry.id
  deleteDialogOpen.value = true
}

function onDeleteConfirm(reason) {
  const id = deletingEntryId.value
  if (!id) {
    return
  }
  const index = section.value.entries.findIndex(e => e.id === id)
  if (index < 0) {
    return
  }
  const removed = section.value.entries[index]
  section.value.entries.splice(index, 1)
  section.value.deletionAudit.push({
    allergy: removed.allergy,
    severity: removed.severity,
    startYear: removed.startYear,
    reason: trimAllergyField(reason),
  })
  deletingEntryId.value = null
  notifySuccess(t('allergyDeletedSuccess'))
}
</script>
