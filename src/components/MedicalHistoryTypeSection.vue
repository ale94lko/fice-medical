<template>
  <AccordionSection
    :icon="icon"
    :title="title"
    :section-test-id="sectionTestId"
    :toggle-test-id="toggleTestId">
    <div
      v-if="canToggleNegative"
      class="row items-center no-wrap q-mb-md">
      <q-checkbox
        :model-value="negativeChecked"
        :disable="!canEditNegative"
        :label="flagLabel"
        :data-testid="flagTestId"
        @update:model-value="onFlagChange"
      />
      <q-icon
        name="info_outline"
        size="16px"
        class="q-ml-xs cursor-pointer text-grey-7">
        <q-tooltip
          class="app-info-tooltip"
          anchor="top middle"
          self="bottom middle"
          :offset="[0, 6]">
          {{ flagTooltip }}
        </q-tooltip>
      </q-icon>
    </div>

    <div
      v-if="negativeChecked"
      class="fmh-list-card q-pa-md">
      <div class="row items-start no-wrap q-gutter-sm">
        <q-icon
          name="check_circle"
          color="positive"
          size="22px" />
        <div>
          <div class="text-body1 text-strong">
            {{ confirmedTitle }}
          </div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            {{ confirmedSubtitle }}
          </div>
        </div>
      </div>
    </div>

    <AdminTablePanel
      v-else
      class="family-medical-history-table-panel admin-table-panel--wide"
      :show-column-settings="false">
      <FamilyMedicalHistoryTable
        :entries="entries"
        :variant="variant"
        :empty-label="emptyLabel"
        :can-edit="canEdit"
        :can-delete="canDelete"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </AdminTablePanel>
  </AccordionSection>
</template>

<script setup>
import AccordionSection from './AccordionSection.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import FamilyMedicalHistoryTable from
  'components/FamilyMedicalHistoryTable.vue'
import { medicalHistoryTypeValues } from 'components/constants.js'

defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  sectionTestId: {
    type: String,
    default: '',
  },
  toggleTestId: {
    type: String,
    default: '',
  },
  flagLabel: {
    type: String,
    required: true,
  },
  flagTooltip: {
    type: String,
    default: '',
  },
  flagTestId: {
    type: String,
    default: '',
  },
  confirmedTitle: {
    type: String,
    required: true,
  },
  confirmedSubtitle: {
    type: String,
    required: true,
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  entries: {
    type: Array,
    default: () => [],
  },
  variant: {
    type: String,
    default: medicalHistoryTypeValues.family,
  },
  negativeChecked: {
    type: Boolean,
    default: false,
  },
  canToggleNegative: {
    type: Boolean,
    default: true,
  },
  canEditNegative: {
    type: Boolean,
    default: true,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['edit', 'delete', 'update:negativeChecked'])

function onFlagChange(value) {
  emit('update:negativeChecked', Boolean(value))
}
</script>
