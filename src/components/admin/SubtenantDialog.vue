<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog subtenant-dialog app-dialog-card"
      :data-testid="subtenantDialogTestIds.dialog">
      <AppDialogHeader
        :close-label="t('close')"
        :info="dialogSubtitle"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-form
        class="subtenant-dialog__form"
        greedy
        novalidate
        @submit.prevent="onSave">
        <q-card-section
          class="app-dialog-card__body q-px-lg q-pt-md q-pb-md
            subtenant-dialog__body subtenant-dialog__stack">
          <div
            class="subtenant-dialog__full
              subtenant-dialog__heading-wrap
              subtenant-dialog__heading-wrap--split"
            :data-testid="subtenantDialogTestIds.section('basic')">
            <SectionHeading
              icon="business"
              :title="t('subtenantSectionBasic')"
            />
            <div class="subtenant-dialog__toggles">
              <FormToggle
                v-model="local.main"
                :disable="readonly"
                :label="t('subtenantMainLabel')"
                :test-id="subtenantDialogTestIds.field('main')"
              />
              <FormToggle
                v-model="statusActive"
                :disable="readonly"
                :label="t('subtenantStatusActiveLabel')"
                :test-id="subtenantDialogTestIds.field('status')"
              />
            </div>
          </div>

          <div class="subtenant-dialog__full
            subtenant-dialog__logo-row">
            <div class="subtenant-dialog__logo">
              <CompanyLogoField
                :file-id="local.photoFileId"
                :file-category="companyLogoCategory"
                :disabled="readonly"
                :test-id="subtenantDialogTestIds.field('logo')"
                @update:file-id="local.photoFileId = $event"
              />
            </div>
            <div class="subtenant-dialog__logo-fields">
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
              <AddClientLabeledField
                :label="t('clinicType')"
                required>
                <FormSelect
                  v-model="local.clinicType"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :options="clinicTypeOptions"
                  :readonly="readonly"
                  :error="Boolean(errors.clinicType)"
                  :error-message="errors.clinicType"
                  :test-id="
                    subtenantDialogTestIds.field('clinic-type')
                  "
                />
              </AddClientLabeledField>
              <AddClientLabeledField
                v-if="showCodeField"
                :label="t('subtenantCodeLabel')">
                <TextInput
                  v-model="local.code"
                  :external-label="true"
                  readonly
                  :test-id="
                    subtenantDialogTestIds.field('code')
                  "
                />
              </AddClientLabeledField>
            </div>
          </div>

          <div
            class="subtenant-dialog__full
              subtenant-dialog__heading-wrap"
            :data-testid="subtenantDialogTestIds.section('datetime')">
            <SectionHeading
              icon="schedule"
              :title="t('subtenantSectionDateTime')"
            />
            <p class="text-body2 text-grey-7 q-mb-none">
              {{ t('subtenantTimezoneHint') }}
            </p>
          </div>
          <AddClientLabeledField
            :label="t('subtenantTimezoneLabel')"
            required>
            <FormSelect
              v-model="local.timezone"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :options="timezoneOptions"
              :readonly="readonly"
              :test-id="subtenantDialogTestIds.field('timezone')"
            />
          </AddClientLabeledField>
          <AddClientLabeledField
            :label="t('subtenantDateFormatLabel')"
            required>
            <FormSelect
              v-model="local.dateFormat"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :options="dateFormatOptions"
              :readonly="readonly"
              :test-id="
                subtenantDialogTestIds.field('date-format')
              "
            />
          </AddClientLabeledField>
          <AddClientLabeledField
            :label="t('subtenantTimeFormatLabel')"
            required>
            <FormSelect
              v-model="local.timeFormat"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :options="timeFormatOptions"
              :readonly="readonly"
              :test-id="
                subtenantDialogTestIds.field('time-format')
              "
            />
          </AddClientLabeledField>
          <AddClientLabeledField
            :label="t('subtenantFirstDayOfWeekLabel')"
            required>
            <FormSelect
              v-model="local.firstDayOfWeek"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :options="firstDayOptions"
              :readonly="readonly"
              :test-id="
                subtenantDialogTestIds.field('first-day')
              "
            />
          </AddClientLabeledField>

          <div
            class="subtenant-dialog__full
              subtenant-dialog__heading-wrap"
            :data-testid="subtenantDialogTestIds.section('legal')">
            <SectionHeading
              icon="account_balance"
              :title="t('subtenantSectionLegal')"
            />
            <p class="text-body2 text-grey-7 q-mb-none">
              {{ t('subtenantSectionLegalHelper') }}
            </p>
          </div>
          <AddClientLabeledField
            :label="t('legalBusinessName')">
            <TextInput
              v-model="local.legalBusinessName"
              :external-label="true"
              :readonly="readonly"
              :maxlength="subtenantLegalBusinessNameMaxLength"
              :error="Boolean(errors.legalBusinessName)"
              :error-message="errors.legalBusinessName"
              :placeholder="t('legalBusinessNamePlaceholder')"
              :test-id="
                subtenantDialogTestIds.field(
                  'legal-business-name',
                )
              "
            />
          </AddClientLabeledField>
          <AddClientLabeledField
            :label="t('taxIdEin')"
            required>
            <TextInput
              :model-value="taxIdDisplay"
              :external-label="true"
              :readonly="readonly"
              :error="Boolean(errors.taxId)"
              :error-message="errors.taxId"
              :placeholder="t('taxIdEinPlaceholder')"
              :maxlength="10"
              :test-id="
                subtenantDialogTestIds.field('tax-id')
              "
              @update:model-value="onTaxIdInput"
            />
            <template #hint>
              {{ t('taxIdEinHint') }}
            </template>
          </AddClientLabeledField>
          <AddClientLabeledField :label="t('billingEmail')">
            <TextInput
              v-model="local.billingEmail"
              :external-label="true"
              :readonly="readonly"
              :error="Boolean(errors.billingEmail)"
              :error-message="errors.billingEmail"
              :placeholder="t('billingEmailPlaceholder')"
              :test-id="
                subtenantDialogTestIds.field('billing-email')
              "
            />
          </AddClientLabeledField>
          <AddClientLabeledField :label="t('billingPhone')">
            <TextInput
              v-model="local.billingPhone"
              :external-label="true"
              :readonly="readonly"
              :placeholder="t('billingPhonePlaceholder')"
              :test-id="
                subtenantDialogTestIds.field('billing-phone')
              "
            />
          </AddClientLabeledField>
          <div class="subtenant-dialog__full">
            <AddClientLabeledField
              :label="t('billingAddress')">
              <TextInput
                v-model="local.billingAddress"
                :external-label="true"
                :readonly="readonly"
                :placeholder="t('billingAddressPlaceholder')"
                :test-id="
                  subtenantDialogTestIds.field(
                    'billing-address',
                  )
                "
              />
            </AddClientLabeledField>
          </div>

          <div
            class="subtenant-dialog__full
              subtenant-dialog__heading-wrap"
            :data-testid="
              subtenantDialogTestIds.section('credentials')
            ">
            <SectionHeading
              icon="badge"
              :title="t('subtenantSectionCredentials')"
            />
            <p class="text-body2 text-grey-7 q-mb-none">
              {{ t('subtenantSectionCredentialsHelper') }}
            </p>
          </div>
        </q-card-section>

        <q-card-actions
          :align="isAdd ? 'between' : 'right'"
          class="app-dialog-card__actions"
          :class="{
            'app-dialog-card__actions--with-hint': isAdd,
          }">
          <div
            v-if="isAdd"
            class="subtenant-dialog__footer-hint">
            <q-icon
              name="info"
              size="18px"
              color="info"
            />
            <span>{{ t('subtenantLegalBillingFooterHint') }}</span>
          </div>
          <div class="subtenant-dialog__footer-actions">
            <q-btn
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :label="readonly ? t('close') : t('cancel')"
              :data-testid="
                subtenantDialogTestIds.btn('cancel')
              "
              @click="onCancel"
            />
            <q-btn
              v-if="!readonly"
              no-caps
              unelevated
              color="primary"
              class="app-btn-primary primary-action"
              type="submit"
              :loading="saving"
              :label="t('save')"
              :data-testid="subtenantDialogTestIds.btn('save')"
            />
          </div>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { subtenantStatusValues, storedFileCategories } from
  'components/constants.js'
import AddClientLabeledField from
  'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import CompanyLogoField from 'components/CompanyLogoField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import SectionHeading from 'components/SectionHeading.vue'
import TextInput from 'components/TextInput.vue'
import {
  cloneSubtenantForm,
  createEmptySubtenantForm,
  subtenantLegalBusinessNameMaxLength,
} from 'src/utils/subtenant-form.js'
import {
  formatEinDisplay,
  isValidEin,
  normalizeEinDigits,
} from 'src/utils/ein.js'
import { subtenantDialogTestIds } from 'src/test-ids/index.js'
import { clinicTypeSelectOptions } from 'src/utils/clinic-type.js'
import {
  DATE_FORMAT_OPTIONS,
  FIRST_DAY_VALUES,
  TIME_FORMAT_VALUES,
  ianaTimezoneSelectOptions,
} from 'src/utils/iana-timezones.js'

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
const companyLogoCategory = storedFileCategories.companyLogo
const clinicTypeOptions = computed(() => clinicTypeSelectOptions(t))
const timezoneOptions = computed(() =>
  ianaTimezoneSelectOptions(local.value.timezone),
)
const dateFormatOptions = DATE_FORMAT_OPTIONS
const timeFormatOptions = computed(() => [
  { label: t('timeFormat12h'), value: TIME_FORMAT_VALUES.h12 },
  { label: t('timeFormat24h'), value: TIME_FORMAT_VALUES.h24 },
])
const firstDayOptions = computed(() => [
  { label: t('firstDaySunday'), value: FIRST_DAY_VALUES.sunday },
  { label: t('firstDayMonday'), value: FIRST_DAY_VALUES.monday },
])
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const taxIdDisplay = computed(() => formatEinDisplay(local.value.taxId))

function onTaxIdInput(value) {
  local.value.taxId = normalizeEinDigits(value)
}

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')
const isAdd = computed(() => props.mode === 'add')

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
  if (!String(local.value.clinicType ?? '').trim()) {
    errors.value.clinicType = t('clinicTypeRequired')
  }
  const legalBusinessName = String(
    local.value.legalBusinessName ?? '',
  ).trim()
  if (legalBusinessName.length > subtenantLegalBusinessNameMaxLength) {
    errors.value.legalBusinessName = t('legalBusinessNameTooLong', {
      max: subtenantLegalBusinessNameMaxLength,
    })
  }
  if (!isValidEin(local.value.taxId)) {
    errors.value.taxId = t('taxIdEinInvalid')
  }
  const billingEmail = String(local.value.billingEmail ?? '').trim()
  if (billingEmail && !EMAIL_RE.test(billingEmail)) {
    errors.value.billingEmail = t('emailInvalid')
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
  if (readonly.value || !validateForm()) {
    return
  }
  emit('save', cloneSubtenantForm(local.value))
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.subtenant-dialog__form {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.subtenant-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
}

.subtenant-dialog__stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  min-width: 0;
  align-items: start;
}

.subtenant-dialog__full {
  grid-column: 1 / -1;
}

.subtenant-dialog__heading-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 8px;
  border-bottom: 1px solid $border-subtle;
}

.subtenant-dialog__heading-wrap :deep(.section-heading) {
  margin: 0;
  max-width: none;
}

.subtenant-dialog__heading-wrap--split {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.subtenant-dialog__heading-wrap--split :deep(.section-heading) {
  flex: 1 1 auto;
  min-width: 0;
}

.subtenant-dialog__logo-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: center;
}

.subtenant-dialog__logo-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.subtenant-dialog__logo {
  min-width: 0;
}

.subtenant-dialog__logo :deep(.company-logo-field) {
  width: 100%;
  align-items: stretch;
}

.subtenant-dialog__logo :deep(.company-logo-field__preview) {
  width: 100%;
  height: 160px;
}

.subtenant-dialog__logo :deep(.company-logo-field__actions) {
  width: 100%;
}

.subtenant-dialog__logo :deep(.company-logo-field__actions .q-btn) {
  width: 100%;
}

.subtenant-dialog__toggles {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  gap: 16px;
}

.subtenant-dialog__stack :deep(
  .q-field--outlined:not(.q-textarea) .q-field__control
) {
  min-height: 40px !important;
  height: 40px !important;
}

.subtenant-dialog__stack :deep(
  .q-field--outlined:not(.q-textarea) .q-field__marginal
) {
  height: 40px !important;
}

.app-dialog-card__actions--with-hint {
  justify-content: space-between;
}

.subtenant-dialog__footer-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 0 auto;
  min-width: 0;
  margin-right: auto;
  padding: 8px 12px;
  border-radius: 8px;
  background: #e0f2fe;
  color: $text-strong;
  font-size: 0.8125rem;
  line-height: 1.4;
  white-space: nowrap;
}

.subtenant-dialog__footer-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  gap: 12px;

  > .q-btn {
    margin: 0;
  }
}

@media (max-width: 599px) {
  .subtenant-dialog__stack,
  .subtenant-dialog__logo-row {
    grid-template-columns: 1fr;
  }

  .subtenant-dialog__heading-wrap--split {
    flex-wrap: wrap;
  }

  .subtenant-dialog__footer-hint {
    white-space: normal;
  }
}
</style>
