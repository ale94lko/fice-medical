<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="staffListTestIds.filtersDialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card staff-filters-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('staffListFiltersTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <AddClientLabeledField :label="t('staffFilterEmploymentStatus')">
              <div class="staff-filters-dialog__chip-grid">
                <q-btn
                  v-for="opt in employmentStatusOptions"
                  :key="opt.value"
                  flat
                  no-caps
                  :class="[
                    'staff-filters-dialog__chip',
                    {
                      'staff-filters-dialog__chip--selected':
                        local.employmentStatuses.includes(opt.value),
                    },
                  ]"
                  @click="toggleEmploymentStatus(opt.value)">
                  {{ opt.label }}
                </q-btn>
              </div>
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
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
          </div>

          <div class="col-12 col-md-6">
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
          </div>

          <div class="col-12 col-md-6">
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
          </div>

          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('staffFilterHireDateFrom')">
              <ClientDateField
                v-model="local.hireDateFrom"
                :close-label="t('close')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('staffFilterHireDateTo')">
              <ClientDateField
                v-model="local.hireDateTo"
                :close-label="t('close')"
              />
            </AddClientLabeledField>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
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

function toggleEmploymentStatus(value) {
  const set = new Set(local.value.employmentStatuses)
  if (set.has(value)) {
    set.delete(value)
  } else {
    set.add(value)
  }
  local.value.employmentStatuses = [...set]
}

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
