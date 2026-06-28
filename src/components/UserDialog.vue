<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="user-dialog app-dialog-card user-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        ref="dialogBodyRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p
          v-if="mode === 'add'"
          class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ t('userDialogAddSubtitle') }}
        </p>
        <q-form
          ref="formRef"
          greedy
          @submit.prevent="onSave">
          <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="requiredLabel(t('email'))"
              :test-id="tid.field('email')">
              <TextInput
                v-model="local.email"
                hide-bottom-space
                :external-label="false"
                :disable="readonly"
                :placeholder="t('emailAddressPlaceholder')"
                :rules="readonly ? [] : emailRules"
                :test-id="tid.field('email')"
              />
            </AddClientLabeledField>
          </div>
          <div
            v-if="!readonly"
            class="col-12 col-md-6">
            <AddClientLabeledField
              :label="passwordLabel"
              :test-id="tid.field('password')">
              <TextInput
                v-model="local.password"
                hide-bottom-space
                type="password"
                :external-label="false"
                :placeholder="passwordPlaceholder"
                :rules="passwordRules"
                :test-id="tid.field('password')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="requiredLabel(t('status'))"
              :test-id="tid.field('status')">
              <FormSelect
                v-model="local.status"
                outlined
                hide-bottom-space
                emit-value
                map-options
                lazy-rules="ondemand"
                :readonly="readonly"
                :options="statusOptions"
                :rules="statusRules"
                :placeholder="t('userStatusPlaceholder')"
                :test-id="tid.field('status')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="requiredLabel(t('userRoles'))"
              :test-id="tid.field('roles')">
              <FormSelect
                v-model="local.roles"
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
                :test-id="tid.field('roles')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('permissions')"
              :test-id="tid.field('permissions')">
              <TreeComponent
                v-model="local.permissions"
                :nodes="permissionTreeNodes"
                :readonly="readonly"
                :loading="permissionsLoading"
                :test-id="tid.field('permissions-tree')"
                :empty-label="t('userPermissionsEmpty')"
                :loading-label="t('userPermissionsLoading')"
                :expand-label="t('treeExpand')"
                :collapse-label="t('treeCollapse')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('description')"
              :test-id="tid.field('description')">
              <q-input
                v-model="local.description"
                outlined
                hide-bottom-space
                type="textarea"
                rows="3"
                :readonly="readonly"
                :maxlength="userDescriptionMaxLength"
                :placeholder="t('userDescriptionPlaceholder')"
                :data-testid="tid.field('description')"
              />
            </AddClientLabeledField>
          </div>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :label="saveLabel"
          :data-testid="tid.btn('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import TextInput from 'components/FormInput.vue'
import FormSelect from 'components/FormSelect.vue'
import {
  quasarNotifyTypes,
  userDescriptionMaxLength,
  userStatusValues,
} from 'components/constants.js'
import { useAuthStore } from 'stores/auth-store.js'
import { userDialogTestIds as tid } from 'src/test-ids/index.js'
import TreeComponent from 'components/template/TreeComponent.vue'
import { fetchTenantRoleOptions } from 'src/utils/tenant-roles-api.js'
import { fetchTenantPermissionTreeNodes } from
  'src/utils/tenant-permissions-api.js'
import { createEmptyUser, cloneUser } from 'src/utils/user-orders.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'add',
    validator: value => ['add', 'edit', 'view'].includes(value),
  },
  user: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()
const local = ref(createEmptyUser())
const roleOptions = ref([])
const rolesLoading = ref(false)
const permissionTreeNodes = ref([])
const permissionsLoading = ref(false)
const formRef = ref(null)
const dialogBodyRef = ref(null)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')
const isAddMode = computed(() => props.mode === 'add')

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('userDialogViewTitle')
  }
  if (props.mode === 'edit') {
    return t('userDialogEditTitle')
  }

  return t('userDialogAddTitle')
})

const saveLabel = computed(() =>
  props.mode === 'add' ? t('addUser') : t('save'),
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
  if (readonly.value || !isAddMode.value) {
    return []
  }

  return [requiredRule(t('passwordRequired'))]
})

const statusRules = computed(() =>
  readonly.value ? [] : [requiredRule(t('fieldRequired'))],
)

const rolesRules = computed(() => (
  readonly.value
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

watch(
  () => [props.modelValue, props.user, props.mode],
  () => {
    if (!props.modelValue) {
      return
    }
    local.value = cloneUser(props.user ?? createEmptyUser())
    if (props.mode === 'add' && !local.value.status) {
      local.value.status = userStatusValues.active
    }
    if (props.mode === 'add' && !Array.isArray(local.value.roles)) {
      local.value.roles = []
    }
    if (props.mode === 'add' && !Array.isArray(local.value.permissions)) {
      local.value.permissions = []
    }
    local.value.password = ''
    loadRoleOptions()
    loadPermissionTree()
    nextTick(() => {
      formRef.value?.resetValidation()
    })
  },
  { immediate: true },
)

function onCancel() {
  emit('cancel')
  open.value = false
}

async function onSave() {
  const valid = await formRef.value?.validate?.()
  if (!valid) {
    await notifyAndScrollToValidationErrors(dialogBodyRef)

    return
  }
  emit('save', {
    user: cloneUser({
      ...local.value,
      password: local.value.password,
    }),
    permissionTreeNodes: permissionTreeNodes.value,
  })
}
</script>
