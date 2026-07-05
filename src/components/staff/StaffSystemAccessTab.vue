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
            :label="requiredLabel(t('email'))"
            :error="Boolean(fieldErrors.email)"
            :error-message="fieldErrors.email">
            <TextInput
              v-model="systemUser.email"
              hide-bottom-space
              :external-label="false"
              :disable="readonly"
              :placeholder="t('emailAddressPlaceholder')"
              :rules="readonly ? [] : emailRules"
            />
          </AddClientLabeledField>
        </div>
        <div
          v-if="!readonly"
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
          v-if="showFullUserFields"
          class="col-12 col-md-6">
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
        <div
          v-if="showFullUserFields"
          class="col-12 col-md-6">
          <AddClientLabeledField
            :label="requiredLabel(t('userRoles'))"
            :error="Boolean(fieldErrors.roles)"
            :error-message="fieldErrors.roles">
            <FormSelect
              v-model="systemUser.roles"
              multiple
              use-chips
              outlined
              hide-bottom-space
              emit-value
              map-options
              lazy-rules="ondemand"
              :readonly="readonly"
              :loading="rolesLoading"
              :options="roleOptions"
              :rules="rolesRules"
              :placeholder="t('userRolesPlaceholder')"
            />
          </AddClientLabeledField>
        </div>
        <div
          v-if="showFullUserFields"
          class="col-12">
          <AddClientLabeledField :label="t('permissions')">
            <TreeComponent
              v-model="systemUser.permissions"
              :nodes="permissionTreeNodes"
              :readonly="readonly"
              :loading="permissionsLoading"
              :empty-label="t('userPermissionsEmpty')"
              :loading-label="t('userPermissionsLoading')"
              :expand-label="t('treeExpand')"
              :collapse-label="t('treeCollapse')"
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

      <div
        v-if="showFullUserFields && !readonly"
        class="staff-system-access-hint row items-start q-mt-md">
        <q-icon name="info_outline" color="primary" size="18px" />
        <span class="text-body2 q-ml-sm">
          {{ t('staffSystemAccessRoleHint') }}
        </span>
      </div>
    </AccordionSection>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AccordionSection from 'components/AccordionSection.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import TextInput from 'components/FormInput.vue'
import TreeComponent from 'components/template/TreeComponent.vue'
import {
  quasarNotifyTypes,
  userDescriptionMaxLength,
  userStatusValues,
} from 'components/constants.js'
import { useAuthStore } from 'stores/auth-store.js'
import { fetchTenantRoleOptions } from 'src/utils/tenant-roles-api.js'
import { fetchTenantPermissionTreeNodes } from
  'src/utils/tenant-permissions-api.js'
import {
  buildNewPasswordRules,
  createOptionalPasswordPolicyRule,
} from 'src/utils/password-validation.js'

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

const systemUser = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const fieldErrors = computed(() => props.fieldErrors ?? {})

const isAddMode = computed(() => !props.isEdit)
const showFullUserFields = computed(() => isAddMode.value || props.readonly)

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
  if (props.readonly) {
    return []
  }
  if (isAddMode.value) {
    return buildNewPasswordRules(t)
  }
  if (props.isEdit) {
    return [createOptionalPasswordPolicyRule(t)]
  }

  return []
})

const statusRules = computed(() =>
  props.readonly || props.isEdit
    ? []
    : [requiredRule(t('fieldRequired'))],
)

const rolesRules = computed(() => (
  props.readonly || props.isEdit
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

function loadUserCatalogs() {
  if (isAddMode.value || props.readonly) {
    loadRoleOptions()
    loadPermissionTree()
    return
  }

  roleOptions.value = []
  permissionTreeNodes.value = []
}

watch(
  () => [props.isEdit, props.readonly],
  () => {
    loadUserCatalogs()
  },
)

onMounted(() => {
  if (isAddMode.value && !systemUser.value.status) {
    systemUser.value = {
      ...systemUser.value,
      status: userStatusValues.active,
    }
  }
  if (!Array.isArray(systemUser.value.roles)) {
    systemUser.value = {
      ...systemUser.value,
      roles: [],
    }
  }
  if (!Array.isArray(systemUser.value.permissions)) {
    systemUser.value = {
      ...systemUser.value,
      permissions: [],
    }
  }
  loadUserCatalogs()
})
</script>
