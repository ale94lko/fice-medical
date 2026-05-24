<template>
  <div class="add-client-family-medical-history-tab">
    <section class="add-client-form__section">
      <AddClientSectionHeading
        icon="add_circle_outline"
        :title="t('fmhAddSectionTitle')"
      />
      <div class="add-client-form__fields">
        <div class="add-client-form__fmh-add-card q-pa-md">
          <div class="row q-col-gutter-md q-col-gutter-lg-md items-end">
            <div class="col-12 col-md-6">
              <q-select
                v-model="section.draft.familyRelationship"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :options="relationshipOptions"
                :label="t('fmhFamilyRelationship')"
                :error="Boolean(draftRelationshipError)"
                :error-message="draftRelationshipError"
              >
                <template #append>
                  <q-icon name="info_outline" class="cursor-pointer">
                    <q-tooltip>{{ t('fmhRelationshipTooltip') }}</q-tooltip>
                  </q-icon>
                </template>
              </q-select>
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="section.draft.medicalConditions"
                outlined
                hide-bottom-space
                :label="t('fmhMedicalConditions')"
                :error="Boolean(draftConditionsError)"
                :error-message="draftConditionsError"
                maxlength="500"
              />
            </div>
            <div class="col-12 flex justify-end">
              <q-btn
                no-caps
                unelevated
                color="primary"
                class="app-btn-primary"
                icon="add"
                :label="t('fmhAdd')"
                @click="onAddEntry"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <q-separator class="q-my-lg" />

    <section class="add-client-form__section">
      <AddClientSectionHeading
        icon="person"
        :title="t('fmhPersonalSectionTitle')"
      />
      <div class="add-client-form__fields">
        <div class="add-client-form__fmh-list-card q-pa-md">
          <FamilyMedicalHistoryTable
            :entries="personalEntries"
            :empty-label="t('fmhPersonalEmpty')"
            @edit="openEdit"
            @delete="openDelete"
          />
        </div>
      </div>
    </section>

    <q-separator class="q-my-lg" />

    <section class="add-client-form__section">
      <AddClientSectionHeading
        icon="groups"
        :title="t('fmhFamilySectionTitle')"
      />
      <div class="add-client-form__fields">
        <div class="add-client-form__fmh-list-card q-pa-md">
          <FamilyMedicalHistoryTable
            :entries="familyEntries"
            :empty-label="t('fmhFamilyEmpty')"
            @edit="openEdit"
            @delete="openDelete"
          />
        </div>
      </div>
    </section>

    <FamilyMedicalHistoryEditDialog
      v-model="editDialogOpen"
      mode="edit"
      :entry="editingEntry"
      :entries="section.entries"
      :relationship-options="relationshipOptions"
      @save="onEditSave"
    />

    <FamilyMedicalHistoryDeleteDialog
      v-model="deleteDialogOpen"
      @confirm="onDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import AddClientSectionHeading from 'components/AddClientSectionHeading.vue'
import FamilyMedicalHistoryTable from 'components/FamilyMedicalHistoryTable.vue'
import FamilyMedicalHistoryEditDialog from
  'components/FamilyMedicalHistoryEditDialog.vue'
import FamilyMedicalHistoryDeleteDialog from
  'components/FamilyMedicalHistoryDeleteDialog.vue'
import {
  clientFamilyRelationshipOptions,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  createEmptyFamilyMedicalHistoryDraft,
  isDuplicateFamilyMedicalHistoryEntry,
  nextFamilyMedicalHistoryId,
  splitFamilyMedicalHistoryEntries,
  trimFamilyMedicalField,
  validateFamilyMedicalHistoryForAdd,
} from 'src/utils/client-family-medical-history.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()

const draftRelationshipError = ref('')
const draftConditionsError = ref('')
const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editingEntry = ref(null)
const deletingEntry = ref(null)

const section = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const relationshipOptions = clientFamilyRelationshipOptions

const personalEntries = computed(
  () => splitFamilyMedicalHistoryEntries(section.value.entries).personal,
)

const familyEntries = computed(
  () => splitFamilyMedicalHistoryEntries(section.value.entries).family,
)

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

function applyDraftValidationErrors(result) {
  draftRelationshipError.value = ''
  draftConditionsError.value = ''
  if (!result.ok && result.errorKey) {
    if (result.errorKey === 'fmhBothRequired') {
      draftRelationshipError.value = t(result.errorKey)
      draftConditionsError.value = t(result.errorKey)
    } else if (
      result.errorKey === 'fmhRelationshipRequired'
      || result.errorKey === 'fmhRelationshipMax'
    ) {
      draftRelationshipError.value = t(
        result.errorKey,
        result.errorKey === 'fmhRelationshipMax' ? { max: 25 } : {},
      )
    } else {
      draftConditionsError.value = t(result.errorKey, {
        max: result.errorKey === 'fmhConditionsInvalid' ? 500 : 25,
      })
    }
  }
}

function onAddEntry() {
  draftRelationshipError.value = ''
  draftConditionsError.value = ''

  const draft = section.value.draft
  const result = validateFamilyMedicalHistoryForAdd(
    draft.familyRelationship,
    draft.medicalConditions,
  )
  if (!result.ok) {
    applyDraftValidationErrors(result)
    notifyError(t(result.errorKey, {
      max: result.errorKey === 'fmhConditionsInvalid' ? 500 : 25,
    }))

    return
  }

  const relationship = trimFamilyMedicalField(draft.familyRelationship)
  const conditions = trimFamilyMedicalField(draft.medicalConditions)

  if (
    isDuplicateFamilyMedicalHistoryEntry(
      section.value.entries,
      relationship,
      conditions,
    )
  ) {
    draftConditionsError.value = t('fmhDuplicateEntry')
    notifyError(t('fmhDuplicateEntry'))

    return
  }

  section.value.entries.push({
    id: nextFamilyMedicalHistoryId(),
    familyRelationship: relationship,
    medicalConditions: conditions,
  })
  section.value.draft = createEmptyFamilyMedicalHistoryDraft()
  notifySuccess(t('fmhAddedSuccess'))
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
  notifySuccess(t('fmhUpdatedSuccess'))
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
      familyRelationship: entry.familyRelationship,
      medicalConditions: entry.medicalConditions,
      reason: String(reason).trim(),
    })
    section.value.entries.splice(index, 1)
    notifySuccess(t('fmhDeletedSuccess'))
  }
  deletingEntry.value = null
}
</script>
