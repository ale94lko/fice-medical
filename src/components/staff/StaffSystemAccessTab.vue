<template>
  <div class="staff-system-access-tab">
    <AccordionSection
      icon="admin_panel_settings"
      :title="t('staffSystemAccessTitle')">
      <p
        v-if="isAddMode && !readonly"
        class="text-body2 text-grey-7 q-mt-none q-mb-md">
        {{ t('userDialogAddSubtitle') }}
      </p>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="emailLabel"
            :error="Boolean(fieldErrors.email)"
            :error-message="fieldErrors.email">
            <TextInput
              v-model="systemUser.email"
              hide-bottom-space
              :external-label="false"
              :disable="emailReadonly"
              :placeholder="t('emailAddressPlaceholder')"
              :rules="emailReadonly ? [] : emailRules"
            />
          </AddClientLabeledField>
        </div>
        <div
          v-if="isAddMode && !readonly"
          class="col-12 col-md-6">
          <AddClientLabeledField
            :label="passwordLabel"
            :error="Boolean(fieldErrors.password)"
            :error-message="fieldErrors.password">
            <TextInput
              v-model="systemUser.password"
              hide-bottom-space
              type="password"
              :external-label="false"
              :placeholder="passwordPlaceholder"
              :rules="passwordRules"
            />
          </AddClientLabeledField>
        </div>
        <div
          v-if="isAddMode && !readonly"
          class="col-12 col-md-6">
          <AddClientLabeledField :label="t('userChangePasswordRequiredLabel')">
            <FormToggle v-model="systemUser.changePasswordRequired" />
          </AddClientLabeledField>
        </div>
        <div
          v-if="showFullUserFields"
          class="col-12 user-dialog__roles-status-block">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="requiredLabel(t('userRoles'))"
                :error="Boolean(fieldErrors.roles)"
                :error-message="fieldErrors.roles">
                <RoleMultiSelect
                  v-model="systemUser.roles"
                  :readonly="readonly"
                  :loading="rolesLoading"
                  :options="roleOptions"
                  :rules="rolesRules"
                  :placeholder="t('userRolesPlaceholder')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="requiredLabel(t('status'))"
                :error="Boolean(fieldErrors.status)"
                :error-message="fieldErrors.status">
                <FormSelect
                  v-model="systemUser.status"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  lazy-rules="ondemand"
                  :readonly="readonly"
                  :options="statusOptions"
                  :rules="statusRules"
                  :placeholder="t('userStatusPlaceholder')"
                />
              </AddClientLabeledField>
            </div>
          </div>
          <RoleMultiSelectChips
            v-model="systemUser.roles"
            :options="roleOptions"
            :readonly="readonly"
          />
        </div>
        <div
          v-if="showFullUserFields"
          class="col-12">
          <AddClientLabeledField :label="t('permissions')">
            <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
              {{ t('userPermissionsSubtitle') }}
            </p>
            <PermissionModulePicker
              v-model="systemUser.permissions"
              :nodes="permissionTreeNodes"
              :readonly="readonly"
              :loading="permissionsLoading"
              :empty-label="t('userPermissionsEmpty')"
              :loading-label="t('userPermissionsLoading')"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12">
          <AddClientLabeledField :label="t('description')">
            <q-input
              v-model="systemUser.description"
              outlined
              hide-bottom-space
              type="textarea"
              rows="3"
              :readonly="readonly"
              :maxlength="userDescriptionMaxLength"
              :placeholder="t('userDescriptionPlaceholder')"
            />
          </AddClientLabeledField>
        </div>
      </div>
    </AccordionSection>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AccordionSection from 'components/AccordionSection.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import TextInput from 'components/FormInput.vue'
import RoleMultiSelect from 'components/RoleMultiSelect.vue'
import RoleMultiSelectChips from 'components/RoleMultiSelectChips.vue'
import PermissionModulePicker from 'components/PermissionModulePicker.vue'
import {
  quasarNotifyTypes,
  userDescriptionMaxLength,
  userStatusValues,
} from 'components/constants.js'
import { useAuthStore } from 'stores/auth-store.js'
import {
  applyRoleSelectionToPermissions,
  fetchTenantRoleOptions,
  mergeRolePermissionsIntoSelection,
} from 'src/utils/tenant-roles-api.js'
import { fetchTenantPermissionTreeNodes } from
  'src/utils/tenant-permissions-api.js'
import { resolvePermissionIdsFromUserSelection } from
  'src/utils/user-register-payload.js'
import { buildNewPasswordRules } from 'src/utils/password-validation.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()

const roleOptions = ref([])
const rolesLoading = ref(false)
const permissionTreeNodes = ref([])
const permissionsLoading = ref(false)
const skipRolePermissionSync = ref(false)

const systemUser = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const fieldErrors = computed(() => props.fieldErrors ?? {})

const isAddMode = computed(() => !props.isEdit)
const emailReadonly = computed(() => props.readonly || props.isEdit)
const showFullUserFields = computed(() =>
  isAddMode.value || props.isEdit || props.readonly,
)

const emailLabel = computed(() =>
  emailReadonly.value
    ? t('email')
    : requiredLabel(t('email')),
)

const statusOptions = computed(() => [
  { label: t('userStatusActive'), value: userStatusValues.active },
  { label: t('userStatusInactive'), value: userStatusValues.inactive },
])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function requiredRule(message) {
  return val => String(val ?? '').trim().length > 0 || message
}

const emailRules = [
  requiredRule(t('emailRequired')),
  val => EMAIL_RE.test(String(val ?? '').trim()) || t('emailInvalid'),
]

const passwordLabel = computed(() =>
  isAddMode.value ? requiredLabel(t('password')) : t('password'),
)

const passwordPlaceholder = computed(() =>
  isAddMode.value
    ? t('userPasswordPlaceholder')
    : t('userPasswordEditPlaceholder'),
)

const passwordRules = computed(() => {
  if (!isAddMode.value || props.readonly) {
    return []
  }

  return buildNewPasswordRules(t)
})

const statusRules = computed(() =>
  props.readonly ? [] : [requiredRule(t('fieldRequired'))],
)

const rolesRules = computed(() => (
  props.readonly
    ? []
    : [
      val => (Array.isArray(val) && val.length > 0) || t('fieldRequired'),
    ]
))

function requiredLabel(text) {
  return `${text} *`
}

async function loadPermissionTree() {
  permissionsLoading.value = true
  try {
    permissionTreeNodes.value = await fetchTenantPermissionTreeNodes()
  } catch {
    permissionTreeNodes.value = []
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('userPermissionsLoadError'),
    })
  } finally {
    permissionsLoading.value = false
  }
}

async function loadRoleOptions() {
  const tenantId = authStore.tenantId
  if (!tenantId) {
    roleOptions.value = []
    return
  }

  rolesLoading.value = true
  try {
    roleOptions.value = await fetchTenantRoleOptions(tenantId)
  } catch {
    roleOptions.value = []
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('userRolesLoadError'),
    })
  } finally {
    rolesLoading.value = false
  }
}

function ensureSystemUserDefaults() {
  const next = { ...systemUser.value }
  let changed = false

  if (isAddMode.value && !next.status) {
    next.status = userStatusValues.active
    changed = true
  }
  if (!Array.isArray(next.roles)) {
    next.roles = []
    changed = true
  }
  if (!Array.isArray(next.permissions)) {
    next.permissions = []
    changed = true
  }
  if (
    isAddMode.value
    && next.changePasswordRequired == null
  ) {
    next.changePasswordRequired = true
    changed = true
  }
  if (isAddMode.value) {
    next.password = next.password ?? ''
    changed = true
  }

  if (changed) {
    systemUser.value = next
  }
}

async function hydrateUserCatalogs() {
  ensureSystemUserDefaults()

  if (!showFullUserFields.value) {
    roleOptions.value = []
    permissionTreeNodes.value = []
    return
  }

  skipRolePermissionSync.value = true
  await Promise.all([loadRoleOptions(), loadPermissionTree()])

  const resolvedPermissions = resolvePermissionIdsFromUserSelection(
    systemUser.value.permissions ?? [],
    permissionTreeNodes.value,
  )
  let permissions = resolvedPermissions
  if ((systemUser.value.roles ?? []).length) {
    permissions = mergeRolePermissionsIntoSelection({
      selectedRoleIds: systemUser.value.roles ?? [],
      currentPermissionIds: resolvedPermissions,
      roleOptions: roleOptions.value,
    })
  }

  systemUser.value = {
    ...systemUser.value,
    permissions,
  }

  await nextTick()
  skipRolePermissionSync.value = false
}

watch(
  () => [...(systemUser.value.roles ?? [])],
  (nextRoles, previousRoles) => {
    if (
      skipRolePermissionSync.value
      || props.readonly
    ) {
      return
    }

    systemUser.value = {
      ...systemUser.value,
      permissions: applyRoleSelectionToPermissions({
        previousRoleIds: previousRoles ?? [],
        nextRoleIds: nextRoles ?? [],
        currentPermissionIds: systemUser.value.permissions ?? [],
        roleOptions: roleOptions.value,
      }),
    }
  },
)

watch(
  () => [props.isEdit, props.readonly],
  () => {
    hydrateUserCatalogs()
  },
)

onMounted(() => {
  hydrateUserCatalogs()
})
</script>
