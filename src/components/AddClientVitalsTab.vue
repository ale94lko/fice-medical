<template>
  <div class="add-client-vitals-tab">
    <div
      v-if="!canView"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('vitalsNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="vitals-header row items-start">
        <div class="col">
          <h2 class="vitals-title">
            {{ t('vitalsHistoryTitle') }}
          </h2>
        </div>
        <div class="col-auto">
          <q-btn
            v-if="!readonly"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="tid.vitalsBtnAdd"
            :label="t('vitalsAdd')"
            @click="openAddDialog"
          />
        </div>
      </div>

      <AdminTablePanel
        class="vitals-table-panel q-mt-md"
        :show-column-settings="false">
        <VitalsHistoryTable
          :entries="sortedEntries"
          :can-edit="!readonly"
          :empty-label="t('vitalsHistoryEmpty')"
          :clinician-options="clinicianOptions"
          @edit="openEditDialog"
          @delete="openDelete"
        />
      </AdminTablePanel>

      <VitalsRecordDialog
        v-model="recordDialogOpen"
        :entry="editingEntry"
        :clinician-options="clinicianOptions"
        :readonly="readonly"
        @save="onRecordSave"
      />

      <ModalComponent
        v-model="deleteDialogOpen"
        test-id="vitals-delete"
        :title="t('vitalsDeleteTitle')"
        :message="t('vitalsDeleteMessage')"
        :confirm-text="t('remove')"
        :cancel-text="t('cancel')"
        @confirm="confirmDelete"
        @cancel="deleteDialogOpen = false"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import VitalsHistoryTable from 'components/VitalsHistoryTable.vue'
import VitalsRecordDialog from 'components/VitalsRecordDialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import {
  createEmptyVitalsDraft,
  nextVitalsId,
  normalizeVitalsEntry,
  sortVitalsEntriesDesc,
} from 'src/utils/client-vitals.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  canView: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()

const recordDialogOpen = ref(false)
const editingEntry = ref(null)
const deleteDialogOpen = ref(false)
const deletingEntryId = ref(null)

const section = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const sortedEntries = computed(() =>
  sortVitalsEntriesDesc(section.value.entries),
)

function openAddDialog() {
  editingEntry.value = null
  recordDialogOpen.value = true
}

function openEditDialog(row) {
  editingEntry.value = { ...row }
  recordDialogOpen.value = true
}

function notifySuccess(message) {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message,
    position: 'top',
  })
}

function onRecordSave({ id, draft }) {
  const normalized = normalizeVitalsEntry(draft)
  const entries = [...section.value.entries]
  if (id) {
    const idx = entries.findIndex(e => e.id === id)
    if (idx >= 0) {
      entries[idx] = {
        ...entries[idx],
        ...normalized,
      }
    }
    notifySuccess(t('vitalsUpdatedSuccess'))
  } else {
    entries.push({
      id: nextVitalsId(),
      ...normalized,
    })
    notifySuccess(t('vitalsSavedSuccess'))
  }
  section.value = {
    ...section.value,
    entries,
    editingId: null,
    draft: createEmptyVitalsDraft(),
  }
  editingEntry.value = null
}

function openDelete(row) {
  deletingEntryId.value = row.id
  deleteDialogOpen.value = true
}

function confirmDelete() {
  const id = deletingEntryId.value
  if (!id) {
    return
  }
  section.value = {
    ...section.value,
    entries: section.value.entries.filter(e => e.id !== id),
    editingId:
      section.value.editingId === id ? null : section.value.editingId,
    draft: createEmptyVitalsDraft(),
  }
  if (editingEntry.value?.id === id) {
    editingEntry.value = null
    recordDialogOpen.value = false
  }
  deletingEntryId.value = null
  deleteDialogOpen.value = false
}

function applySaveValidation() {
  clearSaveValidation()
}

function clearSaveValidation() {
  section.value = {
    ...section.value,
    draft: createEmptyVitalsDraft(),
    editingId: null,
  }
}

defineExpose({
  applySaveValidation,
  clearSaveValidation,
})
</script>
