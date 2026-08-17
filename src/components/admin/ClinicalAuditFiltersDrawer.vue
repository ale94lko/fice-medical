<template>
  <q-dialog
    v-model="open"
    persistent
    position="right"
    full-height
    :data-testid="clinicalAuditTestIds.filtersDrawer"
    transition-show="slide-left"
    transition-hide="slide-right">
    <q-card
      class="clinical-audit-filters-drawer app-dialog-card
        insurance-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        :test-id="clinicalAuditTestIds.filtersDrawer"
        @close="onCancel">
        {{ t('clinicalAuditFiltersTitle') }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body clinical-audit-filters-drawer__body
          q-px-lg q-pt-md q-pb-md">
        <div class="column q-gutter-md">
          <AddClientLabeledField :label="t('clinicalAuditFilterEntityType')">
            <FormSelect
              v-model="local.entityType"
              :options="entityTypeOptions"
              clearable
              outlined
              hide-bottom-space
              emit-value
              map-options
              :test-id="clinicalAuditTestIds.filterField('entity-type')"
              :placeholder="t('clinicalAuditFilterEntityType')"
            />
          </AddClientLabeledField>

          <AddClientLabeledField :label="t('clinicalAuditFilterAction')">
            <FormSelect
              v-model="local.action"
              :options="actionOptions"
              clearable
              outlined
              hide-bottom-space
              emit-value
              map-options
              :test-id="clinicalAuditTestIds.filterField('action')"
              :placeholder="t('clinicalAuditFilterAction')"
            />
          </AddClientLabeledField>

          <AddClientLabeledField :label="t('clinicalAuditFilterFrom')">
            <ClientDateField
              v-model="local.from"
              :close-label="t('close')"
              :error="dateRangeInvalid"
              :test-id="clinicalAuditTestIds.filterField('from')"
              @update:model-value="onFromChange"
            />
          </AddClientLabeledField>

          <AddClientLabeledField :label="t('clinicalAuditFilterTo')">
            <ClientDateField
              v-model="local.to"
              :close-label="t('close')"
              :error="dateRangeInvalid"
              :test-id="clinicalAuditTestIds.filterField('to')"
              :error-message="dateRangeErrorMessage"
              @update:model-value="onToChange"
            />
          </AddClientLabeledField>

          <AddClientLabeledField :label="t('clinicalAuditFilterClient')">
            <FormSelect
              v-model="local.clientId"
              :options="clientFilterOptions"
              clearable
              outlined
              hide-bottom-space
              emit-value
              map-options
              use-input
              fill-input
              hide-selected
              input-debounce="350"
              :test-id="clinicalAuditTestIds.filterField('client')"
              :placeholder="t('clinicalAuditFilterClient')"
              @filter="onClientFilter"
              @update:model-value="onClientIdChange"
            />
          </AddClientLabeledField>

          <AddClientLabeledField :label="t('clinicalAuditFilterChangedBy')">
            <FormSelect
              v-model="local.changedBy"
              :options="changedByFilterOptions"
              clearable
              outlined
              hide-bottom-space
              emit-value
              map-options
              use-input
              fill-input
              hide-selected
              input-debounce="300"
              :test-id="clinicalAuditTestIds.filterField('changed-by')"
              :placeholder="t('clinicalAuditFilterChangedBy')"
              @filter="onChangedByFilter"
              @update:model-value="onChangedByChange"
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
          :data-testid="clinicalAuditTestIds.filtersClear"
          :label="t('clinicalAuditFiltersClear')"
          @click="onClear"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="clinicalAuditTestIds.filtersApply"
          :disable="dateRangeInvalid"
          :label="t('clinicalAuditFiltersApply')"
          @click="onApply"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  clientFieldKeys as ck,
  userFieldKeys as uk,
} from 'components/constants.js'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import { useSiteStore } from 'stores/site-store.js'
import {
  clinicalAuditActionI18nKey,
  clinicalAuditActionValues,
  clinicalAuditEntityI18nKey,
  clinicalAuditEntityTypeValues,
} from 'src/utils/clinical-audit-normalize.js'
import {
  cloneClinicalAuditFilters,
  createEmptyClinicalAuditFilters,
  isClinicalAuditDateRangeValid,
} from 'src/utils/clinical-audit-filters.js'
import { isClientListServerSearchQuery } from
  'src/utils/client-list-search.js'
import { listTenantUsers } from 'src/utils/user-list-api.js'
import { isUserListServerSearchQuery } from
  'src/utils/user-list-search.js'
import { clinicalAuditTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  filters: {
    type: Object,
    default: () => createEmptyClinicalAuditFilters(),
  },
})

const emit = defineEmits(['update:modelValue', 'apply'])

const { t, te } = useI18n()
const siteStore = useSiteStore()

const local = ref(createEmptyClinicalAuditFilters())
const clientFilterOptions = ref([])
const selectedClientOption = ref(null)
const changedByFilterOptions = ref([])
const selectedChangedByOption = ref(null)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const actionOptions = computed(() =>
  clinicalAuditActionValues.map(value => ({
    value,
    label: actionLabel(value),
  })),
)

const entityTypeOptions = computed(() =>
  clinicalAuditEntityTypeValues.map(value => ({
    value,
    label: entityTypeLabel(value),
  })),
)

const dateRangeInvalid = computed(() =>
  !isClinicalAuditDateRangeValid(local.value),
)

const dateRangeErrorMessage = computed(() =>
  dateRangeInvalid.value
    ? t('clinicalAuditFiltersDateRangeInvalid')
    : '',
)

watch(
  () => props.modelValue,
  isOpen => {
    if (!isOpen) {
      return
    }
    syncFromProps()
  },
)

function actionLabel(action) {
  const token = String(action ?? '').trim()
  if (!token) {
    return '—'
  }
  const key = clinicalAuditActionI18nKey(token)

  return key && te(key) ? t(key) : token
}

function entityTypeLabel(entityType) {
  const token = String(entityType ?? '').trim()
  if (!token) {
    return '—'
  }
  const key = clinicalAuditEntityI18nKey(token)

  return key && te(key) ? t(key) : token
}

function buildClientOptionLabel(row) {
  const name = String(row?.[ck.name] ?? '').trim()
  const clientNumber = String(row?.[ck.clientNumber] ?? '').trim()
  if (name && clientNumber) {
    return `${name} (${clientNumber})`
  }

  return name || clientNumber || String(row?.id ?? '')
}

function mapRowToClientOption(row) {
  if (!row || row.id == null) {
    return null
  }

  return {
    label: buildClientOptionLabel(row),
    value: row.id,
  }
}

function mapRowsToClientOptions(rowsList = []) {
  return rowsList
    .map(mapRowToClientOption)
    .filter(Boolean)
}

function ensureSelectedClientInOptions(options = []) {
  const selected = selectedClientOption.value
  if (
    selected
    && !options.some(option => String(option.value) === String(selected.value))
  ) {
    return [selected, ...options]
  }

  return options
}

function buildChangedByOptionLabel(row) {
  const name = String(row?.[uk.name] ?? '').trim()
  const email = String(row?.[uk.email] ?? '').trim()
  if (name && email) {
    return `${name} (${email})`
  }

  return name || email || String(row?.id ?? '')
}

function mapRowToChangedByOption(row) {
  if (!row || row.id == null) {
    return null
  }

  return {
    label: buildChangedByOptionLabel(row),
    value: row.id,
  }
}

function mapRowsToChangedByOptions(rowsList = []) {
  return rowsList
    .map(mapRowToChangedByOption)
    .filter(Boolean)
}

function ensureSelectedChangedByInOptions(options = []) {
  const selected = selectedChangedByOption.value
  if (
    selected
    && !options.some(option => String(option.value) === String(selected.value))
  ) {
    return [selected, ...options]
  }

  return options
}

async function loadClientFilterOptions(query = '') {
  const q = String(query ?? '').trim()
  if (isClientListServerSearchQuery(q)) {
    await siteStore.searchClientList({ q, page: 1, limit: 20 }, t)
  } else {
    await siteStore.getClientList({ page: 1, limit: 20, filter: null }, t)
  }

  return ensureSelectedClientInOptions(
    mapRowsToClientOptions(siteStore.clientList ?? []),
  )
}

async function loadChangedByFilterOptions(query = '') {
  const q = String(query ?? '').trim()
  const result = await listTenantUsers({
    page: 1,
    limit: 20,
    q: isUserListServerSearchQuery(q) ? q : '',
  }, t)

  return ensureSelectedChangedByInOptions(
    mapRowsToChangedByOptions(result.items ?? []),
  )
}

function onClientFilter(val, update, abort) {
  const q = String(val ?? '').trim()
  if (q.length > 0 && !isClientListServerSearchQuery(q)) {
    update(() => {
      clientFilterOptions.value = ensureSelectedClientInOptions(
        selectedClientOption.value ? [selectedClientOption.value] : [],
      )
    })

    return
  }

  void (async() => {
    try {
      const options = await loadClientFilterOptions(q)
      update(() => {
        clientFilterOptions.value = options
      })
    } catch {
      abort()
    }
  })()
}

function onChangedByFilter(val, update, abort) {
  const q = String(val ?? '').trim()
  if (q.length > 0 && !isUserListServerSearchQuery(q)) {
    update(() => {
      changedByFilterOptions.value = ensureSelectedChangedByInOptions(
        selectedChangedByOption.value
          ? [selectedChangedByOption.value]
          : [],
      )
    })

    return
  }

  void (async() => {
    try {
      const options = await loadChangedByFilterOptions(q)
      update(() => {
        changedByFilterOptions.value = options
      })
    } catch {
      abort()
    }
  })()
}

function onClientIdChange(value) {
  if (value == null || value === '') {
    selectedClientOption.value = null
    local.value.clientOption = null

    return
  }
  const match = clientFilterOptions.value.find(
    option => String(option.value) === String(value),
  )
  if (match) {
    selectedClientOption.value = match
    local.value.clientOption = match
  }
}

function onChangedByChange(value) {
  if (value == null || value === '') {
    selectedChangedByOption.value = null
    local.value.changedByOption = null

    return
  }
  const match = changedByFilterOptions.value.find(
    option => String(option.value) === String(value),
  )
  if (match) {
    selectedChangedByOption.value = match
    local.value.changedByOption = match
  }
}

function syncFromProps() {
  local.value = cloneClinicalAuditFilters(props.filters)
  selectedClientOption.value = props.filters?.clientOption
    ? { ...props.filters.clientOption }
    : null
  selectedChangedByOption.value = props.filters?.changedByOption
    ? { ...props.filters.changedByOption }
    : null
  clientFilterOptions.value = ensureSelectedClientInOptions(
    selectedClientOption.value ? [selectedClientOption.value] : [],
  )
  changedByFilterOptions.value = ensureSelectedChangedByInOptions(
    selectedChangedByOption.value ? [selectedChangedByOption.value] : [],
  )
}

function onCancel() {
  open.value = false
}

function onFromChange(value) {
  local.value = {
    ...local.value,
    from: value ?? '',
  }
}

function onToChange(value) {
  local.value = {
    ...local.value,
    to: value ?? '',
  }
}

function onClear() {
  local.value = createEmptyClinicalAuditFilters()
  selectedClientOption.value = null
  selectedChangedByOption.value = null
  clientFilterOptions.value = []
  changedByFilterOptions.value = []
}

function onApply() {
  if (dateRangeInvalid.value) {
    return
  }
  emit('apply', cloneClinicalAuditFilters({
    ...local.value,
    clientOption: selectedClientOption.value,
    changedByOption: selectedChangedByOption.value,
  }))
  open.value = false
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.clinical-audit-filters-drawer {
  width: min(400px, 100vw);
  max-width: 400px;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0;
}

.clinical-audit-filters-drawer :deep(.app-dialog-header),
.clinical-audit-filters-drawer :deep(.app-dialog-card__actions) {
  flex-shrink: 0;
}

.clinical-audit-filters-drawer__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
