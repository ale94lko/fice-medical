<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog service-procedure-dialog app-dialog-card"
      :data-testid="serviceProcedureDialogTestIds.dialog">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md
          service-procedure-dialog__body">
        <p
          v-if="dialogSubtitle"
          class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ dialogSubtitle }}
        </p>

        <SubsectionHeading
          icon="medical_services"
          :title="t('serviceProcedureSectionGeneral')"
          :step="1"
        />
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('serviceProcedureNameLabel')"
              required>
              <TextInput
                v-model="local.name"
                :external-label="true"
                :readonly="readonly"
                :error="Boolean(errors.name)"
                :error-message="errors.name"
                :test-id="serviceProcedureDialogTestIds.field('name')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('serviceProcedureCategoryLabel')"
              required>
              <FormSelect
                v-model="local.category"
                :options="categoryOptions"
                :readonly="readonly"
                :error="Boolean(errors.category)"
                :error-message="errors.category"
                :test-id="serviceProcedureDialogTestIds.field('category')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('serviceProcedureDescriptionLabel')">
              <TextInput
                v-model="local.description"
                type="textarea"
                autogrow
                :external-label="true"
                :readonly="readonly"
                :test-id="serviceProcedureDialogTestIds.field('description')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <FormToggle
              v-model="statusActive"
              :disable="readonly"
              :label="t('serviceProcedureStatusActiveLabel')"
            />
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="schedule"
            :title="t('serviceProcedureSectionOperational')"
            :step="2"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('serviceProcedureMinDurationLabel')">
                <TextInput
                  v-model="local.minDurationMin"
                  type="number"
                  :external-label="true"
                  :readonly="readonly"
                  :error="Boolean(errors.minDurationMin)"
                  :error-message="errors.minDurationMin"
                  :test-id="serviceProcedureDialogTestIds.field('min-duration')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('serviceProcedureMaxDurationLabel')">
                <TextInput
                  v-model="local.maxDurationMin"
                  type="number"
                  :external-label="true"
                  :readonly="readonly"
                  :error="Boolean(errors.maxDurationMin)"
                  :error-message="errors.maxDurationMin"
                  :test-id="serviceProcedureDialogTestIds.field('max-duration')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <FormToggle
                v-model="local.requiresAppointment"
                :disable="readonly"
                :label="t('serviceProcedureRequiresAppointmentLabel')"
              />
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="payments"
            :title="t('serviceProcedureSectionBilling')"
            :step="3"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-4">
              <AddClientLabeledField :label="t('serviceProcedureCptCodeLabel')">
                <TextInput
                  v-model="local.cptCode"
                  :external-label="true"
                  :readonly="readonly"
                  :test-id="serviceProcedureDialogTestIds.field('cpt-code')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('serviceProcedureHcpcsCodeLabel')">
                <TextInput
                  v-model="local.hcpcsCode"
                  :external-label="true"
                  :readonly="readonly"
                  :test-id="serviceProcedureDialogTestIds.field('hcpcs-code')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('serviceProcedureDefaultFeeLabel')">
                <TextInput
                  v-model="local.defaultFee"
                  type="number"
                  :external-label="true"
                  :readonly="readonly"
                  :error="Boolean(errors.defaultFee)"
                  :error-message="errors.defaultFee"
                  :test-id="serviceProcedureDialogTestIds.field('default-fee')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="verified_user"
            :title="t('serviceProcedureSectionAuthorization')"
            :step="4"
          />
          <p class="text-body2 text-grey-7 q-mb-md">
            {{ t('serviceProcedureAuthorizationHint') }}
          </p>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('serviceProcedureAuthorizationRequirementLabel')"
                required>
                <FormSelect
                  v-model="local.authorizationRequirement"
                  :options="authorizationOptions"
                  :readonly="readonly"
                  :test-id="serviceProcedureDialogTestIds.field('auth-req')"
                />
              </AddClientLabeledField>
            </div>
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
          :data-testid="serviceProcedureDialogTestIds.btn('cancel')"
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
          :data-testid="serviceProcedureDialogTestIds.btn('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { serviceProcedureStatusValues } from 'components/constants.js'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import TextInput from 'components/TextInput.vue'
import {
  buildAuthorizationRequirementOptions,
  buildServiceProcedureCategoryOptions,
} from 'src/composables/useServiceProcedurePermissions.js'
import {
  cloneServiceProcedureForm,
  createEmptyServiceProcedureForm,
  validateServiceProcedureForm,
} from 'src/utils/service-procedure-form.js'
import { serviceProcedureDialogTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: {
    type: String,
    default: 'add',
    validator: value => ['add', 'edit', 'view'].includes(value),
  },
  serviceProcedure: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])
const { t } = useI18n()

const local = ref(createEmptyServiceProcedureForm())
const errors = ref({})

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')
const categoryOptions = computed(() => buildServiceProcedureCategoryOptions(t))
const authorizationOptions = computed(() =>
  buildAuthorizationRequirementOptions(t),
)

const dialogTitle = computed(() => {
  if (props.mode === 'add') {
    return t('serviceProcedureDialogAddTitle')
  }
  if (props.mode === 'edit') {
    return t('serviceProcedureDialogEditTitle')
  }

  return t('serviceProcedureDialogViewTitle')
})

const dialogSubtitle = computed(() => {
  if (props.mode === 'add') {
    return t('serviceProcedureDialogAddSubtitle')
  }
  if (props.mode === 'edit') {
    return t('serviceProcedureDialogEditSubtitle')
  }

  return ''
})

const statusActive = computed({
  get: () => local.value.status === serviceProcedureStatusValues.active,
  set: value => {
    local.value.status = value
      ? serviceProcedureStatusValues.active
      : serviceProcedureStatusValues.inactive
  },
})

function resetErrors() {
  errors.value = {}
}

function syncLocalFromProps() {
  if (props.serviceProcedure) {
    local.value = cloneServiceProcedureForm(props.serviceProcedure)
  } else {
    local.value = createEmptyServiceProcedureForm()
  }
  resetErrors()
}

watch(
  () => [props.modelValue, props.serviceProcedure, props.mode],
  () => {
    if (props.modelValue) {
      syncLocalFromProps()
    }
  },
  { immediate: true },
)

function onCancel() {
  emit('cancel')
  open.value = false
}

function onSave() {
  const nextErrors = validateServiceProcedureForm(local.value, t)
  errors.value = nextErrors
  if (Object.keys(nextErrors).length > 0) {
    return
  }
  emit('save', cloneServiceProcedureForm(local.value))
}
</script>

<style lang="scss" scoped>
.service-procedure-dialog {
  &__body {
    max-height: min(75vh, 720px);
    overflow-y: auto;
  }
}
</style>
