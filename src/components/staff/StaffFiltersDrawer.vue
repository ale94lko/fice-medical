<template>
  <q-dialog
    v-model="open"
    persistent
    position="right"
    full-height
    :data-testid="staffListTestIds.filtersDrawer"
    transition-show="slide-left"
    transition-hide="slide-right">
    <q-card
      class="staff-filters-drawer app-dialog-card
        insurance-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('staffListFiltersTitle') }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body staff-filters-drawer__body
          q-px-lg q-pt-md q-pb-md">
        <div class="column q-gutter-md">
          <AddClientLabeledField :label="t('staffFilterStaffType')">
            <FormSelect
              v-model="local.staffType"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :options="staffTypeOptions"
            />
          </AddClientLabeledField>

          <AddClientLabeledField :label="t('staffFilterEmploymentStatus')">
            <FormSelect
              v-model="local.employmentStatus"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              :options="employmentStatusOptions"
              :placeholder="t('staffFilterEmploymentStatus')"
            />
          </AddClientLabeledField>

          <AddClientLabeledField :label="t('staffFilterPosition')">
            <FormSelect
              v-model="local.positions"
              outlined
              hide-bottom-space
              emit-value
              map-options
              multiple
              use-chips
              clearable
              :options="positionOptions"
              :placeholder="t('staffFilterPositionPlaceholder')"
            />
          </AddClientLabeledField>

          <AddClientLabeledField :label="t('staffFilterCredentialStatus')">
            <FormSelect
              v-model="local.credentialStatus"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              :options="credentialStatusOptions"
              :placeholder="t('staffFilterCredentialStatusPlaceholder')"
            />
          </AddClientLabeledField>

          <AddClientLabeledField :label="t('staffFilterHireDateFrom')">
            <ClientDateField
              v-model="local.hireDateFrom"
              :close-label="t('close')"
            />
          </AddClientLabeledField>

          <AddClientLabeledField :label="t('staffFilterHireDateTo')">
            <ClientDateField
              v-model="local.hireDateTo"
              :close-label="t('close')"
            />
          </AddClientLabeledField>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="staffListTestIds.filtersClear"
          :label="t('staffListFiltersClear')"
          @click="onClear"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="staffListTestIds.filtersApply"
          :label="t('staffListFiltersApply')"
          @click="onApply"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import {
  staffCredentialStatuses,
  staffStaffTypes,
} from 'components/constants.js'
import {
  createEmptyStaffListFilters,
  staffListFiltersToApiPayload,
} from 'src/utils/staff-list-filters.js'
import { staffStatusOptions } from 'src/utils/staff-status.js'
import { staffListTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  filters: {
    type: Object,
    default: () => createEmptyStaffListFilters(),
  },
  positionOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'apply'])

const { t } = useI18n()

const local = ref(createEmptyStaffListFilters())

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const employmentStatusOptions = computed(() => staffStatusOptions(t))

const staffTypeOptions = computed(() => [
  { label: t('staffFilterStaffTypeAll'), value: staffStaffTypes.all },
  {
    label: t('staffFilterStaffTypeClinicians'),
    value: staffStaffTypes.clinicians,
  },
  {
    label: t('staffFilterStaffTypeNonClinical'),
    value: staffStaffTypes.nonClinical,
  },
])

const credentialStatusOptions = computed(() => [
  {
    label: t('staffCredentialStatusValid'),
    value: staffCredentialStatuses.valid,
  },
  {
    label: t('staffCredentialStatusExpiringSoon'),
    value: staffCredentialStatuses.expiringSoon,
  },
  {
    label: t('staffCredentialStatusExpired'),
    value: staffCredentialStatuses.expired,
  },
  {
    label: t('staffCredentialStatusMissing'),
    value: staffCredentialStatuses.missing,
  },
])

watch(
  () => props.modelValue,
  isOpen => {
    if (!isOpen) {
      return
    }
    local.value = staffListFiltersToApiPayload(props.filters)
  },
)

function onCancel() {
  open.value = false
}

function onClear() {
  local.value = createEmptyStaffListFilters()
}

function onApply() {
  emit('apply', staffListFiltersToApiPayload(local.value))
  open.value = false
}
</script>

<style lang="scss" scoped>
.staff-filters-drawer {
  width: min(400px, 100vw);
  max-width: 400px;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0;
}

.staff-filters-drawer :deep(.app-dialog-header),
.staff-filters-drawer :deep(.app-dialog-card__actions) {
  flex-shrink: 0;
}

.staff-filters-drawer__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
