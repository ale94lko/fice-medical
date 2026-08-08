<template>
  <q-dialog
    v-model="open"
    persistent
    position="right"
    full-height
    :data-testid="userListTestIds.filtersDrawer"
    transition-show="slide-left"
    transition-hide="slide-right">
    <q-card
      class="user-list-filters-drawer app-dialog-card
        insurance-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('userListFiltersTitle') }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body user-list-filters-drawer__body
          q-px-lg q-pt-md q-pb-md">
        <div class="column q-gutter-md">
          <AddClientLabeledField :label="t('userListFilterRole')">
            <FormSelect
              v-model="local.role"
              :options="roleOptions"
              :loading="rolesLoading"
              clearable
              outlined
              hide-bottom-space
              emit-value
              map-options
              :placeholder="t('userListFilterRole')"
              :test-id="userListTestIds.roleFilter"
            />
          </AddClientLabeledField>

          <AddClientLabeledField :label="t('userListFilterStatus')">
            <FormSelect
              v-model="local.status"
              :options="statusOptions"
              clearable
              outlined
              hide-bottom-space
              emit-value
              map-options
              :placeholder="t('userListFilterStatus')"
              :test-id="userListTestIds.statusFilter"
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
          :data-testid="userListTestIds.filtersClear"
          :label="t('userListFiltersClear')"
          @click="onClear"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="userListTestIds.filtersApply"
          :label="t('userListFiltersApply')"
          @click="onApply"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { userStatusValues } from 'components/constants.js'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import { useAuthStore } from 'stores/auth-store.js'
import { userListTestIds } from 'src/test-ids/index.js'
import { fetchTenantRoleOptions } from 'src/utils/tenant-roles-api.js'
import {
  cloneUserListFilters,
  createEmptyUserListFilters,
} from 'src/utils/user-list-filters.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  filters: {
    type: Object,
    default: () => createEmptyUserListFilters(),
  },
})

const emit = defineEmits(['update:modelValue', 'apply'])

const { t } = useI18n()
const authStore = useAuthStore()

const local = ref(createEmptyUserListFilters())
const roleOptions = ref([])
const rolesLoading = ref(false)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const statusOptions = computed(() => [
  {
    label: t('userStatusActive'),
    value: userStatusValues.active,
  },
  {
    label: t('userStatusInactive'),
    value: userStatusValues.inactive,
  },
  {
    label: t('userStatusPending'),
    value: userStatusValues.pending,
  },
])

watch(
  () => props.modelValue,
  isOpen => {
    if (!isOpen) {
      return
    }
    syncFromProps()
    loadRoleOptions()
  },
)

function syncFromProps() {
  local.value = cloneUserListFilters(props.filters)
}

async function loadRoleOptions() {
  const tenantId = authStore.tenantId
  if (!tenantId) {
    roleOptions.value = []
    return
  }

  rolesLoading.value = true
  try {
    const options = await fetchTenantRoleOptions(tenantId)
    roleOptions.value = options.map(option => ({
      label: option.label ?? option.name,
      value: String(option.value ?? option.id),
    }))
  } catch {
    roleOptions.value = []
  } finally {
    rolesLoading.value = false
  }
}

function onCancel() {
  open.value = false
}

function onClear() {
  local.value = createEmptyUserListFilters()
}

function onApply() {
  emit('apply', cloneUserListFilters(local.value))
  open.value = false
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.user-list-filters-drawer {
  width: min(400px, 100vw);
  max-width: 400px;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0;
}

.user-list-filters-drawer :deep(.app-dialog-header),
.user-list-filters-drawer :deep(.app-dialog-card__actions) {
  flex-shrink: 0;
}

.user-list-filters-drawer__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
