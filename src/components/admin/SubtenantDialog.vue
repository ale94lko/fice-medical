<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog subtenant-dialog app-dialog-card"
      :data-testid="subtenantDialogTestIds.dialog">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p
          v-if="dialogSubtitle"
          class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ dialogSubtitle }}
        </p>

        <div class="row q-col-gutter-md">
          <div class="col-12">
            <AddClientLabeledField
              :label="t('subtenantNameLabel')"
              required>
              <TextInput
                v-model="local.name"
                :external-label="true"
                :readonly="readonly"
                :error="Boolean(errors.name)"
                :error-message="errors.name"
                :test-id="subtenantDialogTestIds.field('name')"
              />
            </AddClientLabeledField>
          </div>

          <div
            v-if="showCodeField"
            class="col-12">
            <AddClientLabeledField :label="t('subtenantCodeLabel')">
              <TextInput
                v-model="local.code"
                :external-label="true"
                readonly
                :test-id="subtenantDialogTestIds.field('code')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
            <FormToggle
              v-model="local.main"
              :disable="readonly"
              :label="t('subtenantMainLabel')"
            />
          </div>

          <div class="col-12 col-md-6">
            <FormToggle
              v-model="statusActive"
              :disable="readonly"
              :label="t('subtenantStatusActiveLabel')"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          :data-testid="subtenantDialogTestIds.btn('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :label="t('save')"
          :data-testid="subtenantDialogTestIds.btn('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { subtenantStatusValues } from 'components/constants.js'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormToggle from 'components/FormToggle.vue'
import TextInput from 'components/TextInput.vue'
import {
  cloneSubtenantForm,
  createEmptySubtenantForm,
} from 'src/utils/subtenant-form.js'
import { subtenantDialogTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: {
    type: String,
    default: 'add',
    validator: value => ['add', 'edit', 'view'].includes(value),
  },
  subtenant: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])
const { t } = useI18n()

const local = ref(createEmptySubtenantForm())
const errors = ref({})

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')

const showCodeField = computed(() =>
  props.mode !== 'add' && String(local.value.code ?? '').trim(),
)

const dialogTitle = computed(() => {
  if (props.mode === 'add') {
    return t('subtenantDialogAddTitle')
  }
  if (props.mode === 'edit') {
    return t('subtenantDialogEditTitle')
  }

  return t('subtenantDialogViewTitle')
})

const dialogSubtitle = computed(() => {
  if (props.mode === 'add') {
    return t('subtenantDialogAddSubtitle')
  }
  if (props.mode === 'edit') {
    return t('subtenantDialogEditSubtitle')
  }

  return ''
})

const statusActive = computed({
  get: () => local.value.status === subtenantStatusValues.active,
  set: value => {
    local.value.status = value
      ? subtenantStatusValues.active
      : subtenantStatusValues.inactive
  },
})

function resetErrors() {
  errors.value = {}
}

function validateForm() {
  resetErrors()
  if (!String(local.value.name ?? '').trim()) {
    errors.value.name = t('subtenantNameRequired')
  }

  return Object.keys(errors.value).length === 0
}

function syncLocalFromProps() {
  if (props.subtenant) {
    local.value = cloneSubtenantForm(props.subtenant)
  } else {
    local.value = createEmptySubtenantForm()
  }
  resetErrors()
}

watch(
  () => [props.modelValue, props.subtenant, props.mode],
  () => {
    if (props.modelValue) {
      syncLocalFromProps()
    }
  },
  { immediate: true },
)

function onCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}

function onSave() {
  if (!validateForm()) {
    return
  }
  emit('save', cloneSubtenantForm(local.value))
}
</script>
