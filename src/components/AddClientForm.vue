<template>
  <div class="add-client-form">
    <q-banner
        v-if="successVisible"
        dense
        class="bg-positive text-white text-center q-mb-md rounded-borders">
        {{ t('clientSavedSuccess') }}
      </q-banner>

      <div
        :class="[
          'row items-center justify-between',
          'add-client-form__tabs-row',
        ]">
        <q-tabs
        v-model="activeTab"
        dense
        no-caps
        outside-arrows
        mobile-arrows
        class="add-client-tabs col"
        active-color="white"
        indicator-color="transparent"
        align="left">
        <q-tab
          :name="addClientTabKeys.basic"
          :label="t('tabBasicInfo')"
          :disable="!isTabEnabled(addClientTabKeys.basic)"
        />
        <q-tab
          :name="addClientTabKeys.contact"
          :label="t('tabContact')"
          :disable="!isTabEnabled(addClientTabKeys.contact)"
        />
        <q-tab
          :name="addClientTabKeys.familyMedicalHistory"
          :label="t('tabFamilyMedicalHistory')"
          :disable="!isTabEnabled(addClientTabKeys.familyMedicalHistory)"
        />
        <q-tab
          :name="addClientTabKeys.allergies"
          :label="t('tabAllergies')"
          class="add-client-tab--allergies"
          :disable="!isTabEnabled(addClientTabKeys.allergies)"
        />
        <q-tab
          :name="addClientTabKeys.assessments"
          :label="t('tabAssessments')"
          :disable="!isTabEnabled(addClientTabKeys.assessments)"
        />
        <q-tab
          :name="addClientTabKeys.clinical"
          :disable="!isTabEnabled(addClientTabKeys.clinical)">
          <span class="row items-center no-wrap">
            {{ t('tabClinical') }}
            <q-icon name="arrow_drop_down" size="18px" class="q-ml-xs" />
          </span>
        </q-tab>
        <q-tab
          :name="addClientTabKeys.careCoordination"
          :disable="!isTabEnabled(addClientTabKeys.careCoordination)">
          <span class="row items-center no-wrap">
            {{ t('tabCareCoordination') }}
            <q-icon name="arrow_drop_down" size="18px" class="q-ml-xs" />
          </span>
        </q-tab>
        <q-tab
          :name="addClientTabKeys.financials"
          :disable="!isTabEnabled(addClientTabKeys.financials)">
          <span class="row items-center no-wrap">
            {{ t('tabFinancials') }}
            <q-icon name="arrow_drop_down" size="18px" class="q-ml-xs" />
          </span>
        </q-tab>
        <q-tab
          :name="addClientTabKeys.documents"
          :disable="!isTabEnabled(addClientTabKeys.documents)">
          <span class="row items-center no-wrap">
            {{ t('tabDocuments') }}
            <q-icon name="arrow_drop_down" size="18px" class="q-ml-xs" />
          </span>
        </q-tab>
      </q-tabs>
      <q-badge
        outline
        color="grey-7"
        class="client-number-badge text-body2 q-px-md q-py-sm">
        {{ t('clientNumber') }}: {{ form[ck.clientNumber] }}
      </q-badge>
    </div>

    <div class="add-client-form__panel-scroll">
      <q-form
        ref="formRef"
        greedy
        novalidate
        autocomplete="off"
        @submit.prevent="onSave">
        <q-tab-panels v-model="activeTab" animated class="bg-transparent">
        <q-tab-panel :name="addClientTabKeys.basic" class="q-pa-none">
          <section class="add-client-form__section">
            <AddClientSectionHeading
              icon="person"
              :title="t('personalInformation')"
            />
            <div class="add-client-form__fields">
              <div class="row q-col-gutter-md q-col-gutter-lg-md">
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.firstName]"
                    :label="requiredLabel(t('firstName'))"
                    :rules="rules.firstName"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.middleName]"
                    :label="t('middleName')"
                    :rules="rules.middleName"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.lastName]"
                    :label="requiredLabel(t('lastName'))"
                    :rules="rules.lastName"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="form[ck.suffix]"
                    outlined
                    hide-bottom-space
                    emit-value
                    map-options
                    :options="suffixSelectOptions"
                    :label="t('suffix')"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <ClientDateField
                    v-model="form[ck.dob]"
                    :label="t('dob')"
                    :rules="rules.dob"
                    :close-label="t('close')"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <div class="row q-col-gutter-sm">
                    <div class="col-6">
                      <q-input
                        v-model="form[ck.age]"
                        outlined
                        hide-bottom-space
                        type="number"
                        :readonly="ageReadonly"
                        :label="t('age')"
                        :rules="rules.age"
                        :filled="ageReadonly"
                        min="0"
                        :max="clientMaxAge"
                      />
                    </div>
                    <div class="col-6">
                      <q-select
                        v-model="form[ck.ageUnit]"
                        outlined
                        hide-bottom-space
                        emit-value
                        map-options
                        :options="ageUnitSelectOptions"
                        :label="t('ageUnit')"
                      />
                    </div>
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="add-client-form__sex-field">
                    <span class="add-client-form__outlined-field-label">
                      {{ t('sex') }}
                    </span>
                    <q-option-group
                      v-model="form[ck.sex]"
                      :options="sexOptions"
                      type="radio"
                      inline
                      class="add-client-form__sex-group"
                    />
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    outlined
                    hide-bottom-space
                    :label="t('socialSecurityNumber')"
                    :model-value="ssnDisplayValue"
                    :rules="rules.ssn"
                    maxlength="11"
                    @focus="onSsnFocus"
                    @blur="onSsnBlur"
                    @update:model-value="onSsnInput"
                  />
                </div>
              </div>
            </div>
          </section>

          <q-separator class="q-my-lg" />

          <section class="add-client-form__section">
            <AddClientSectionHeading
              icon="admin_panel_settings"
              :title="t('administrativeInformation')"
            />
            <div class="add-client-form__fields">
              <div class="row q-col-gutter-md q-col-gutter-lg-md">
                <div class="col-12 col-md-6">
                  <ClientDateField
                    v-model="form[ck.admissionDate]"
                    :label="requiredLabel(t('admissionDate'))"
                    :rules="rules.admissionDate"
                    :max-today="true"
                    :close-label="t('close')"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="form[ck.assignedClinician]"
                    outlined
                    hide-bottom-space
                    emit-value
                    map-options
                    clearable
                    use-input
                    input-debounce="0"
                    :options="assignedClinicianOptions"
                    :label="t('assignedClinician')"
                  />
                </div>
              </div>
            </div>
          </section>
        </q-tab-panel>

        <q-tab-panel :name="addClientTabKeys.contact" class="q-pa-none">
          <AddClientContactTab
            v-model="form[contactSectionKey]"
            :rules="contactRules"
          />
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.familyMedicalHistory"
          class="q-pa-none">
          <AddClientFamilyMedicalHistoryTab
            v-model="form[clientFormSections.familyMedicalHistory]"
          />
        </q-tab-panel>

        <q-tab-panel
          v-for="tab in comingSoonTabKeys"
          :key="tab"
          :name="tab"
          class="q-pa-none">
          <div class="text-body1 text-grey-7 q-py-xl text-center">
            {{ t('tabComingSoon') }}
          </div>
        </q-tab-panel>
      </q-tab-panels>
      </q-form>
    </div>

    <ModalComponent
      v-model="cancelConfirmOpen"
      :title="t('cancelClientRegistrationTitle')"
      :message="t('cancelClientRegistrationMessage')"
      :confirm-text="t('keepEditing')"
      :cancel-text="t('discardChanges')"
      @confirm="dismissCancelConfirm"
      @cancel="confirmDiscard"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import TextInput from 'components/TextInput.vue'
import ClientDateField from 'components/ClientDateField.vue'
import ModalComponent from 'components/ModalComponent.vue'
import AddClientContactTab from 'components/AddClientContactTab.vue'
import AddClientFamilyMedicalHistoryTab from
  'components/AddClientFamilyMedicalHistoryTab.vue'
import AddClientSectionHeading from 'components/AddClientSectionHeading.vue'
import { useSiteStore } from 'stores/site-store.js'
import { useAddClientForm } from 'src/composables/useAddClientForm.js'
import {
  addClientTabKeys,
  clientFormSections,
  clientMaxAge,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  formatSsnMasked,
  normalizeSsnDigits,
} from 'src/utils/client-form.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'

const emit = defineEmits(['saved', 'cancel', 'tab-label'])

const $q = useQuasar()
const { t } = useI18n()
const siteStore = useSiteStore()

const saving = ref(false)
const successVisible = ref(false)
const cancelConfirmOpen = ref(false)
const ssnEditing = ref(false)
const {
  ck,
  contactSectionKey,
  form,
  formRef,
  activeTab,
  ageReadonly,
  ageUnitSelectOptions,
  assignedClinicianOptions,
  sexOptions,
  suffixSelectOptions,
  rules,
  contactRules,
  resetForm,
  markPristine,
  isDirty,
  goNextTab,
  canGoNext,
  goPreviousTab,
  canGoPrevious,
  isTabEnabled,
  validateCurrentTabAndUnlock,
  validateTabsThrough,
  tabIndex,
  tabLabelFor,
} = useAddClientForm(t)

const comingSoonTabKeys = [
  addClientTabKeys.allergies,
  addClientTabKeys.assessments,
  addClientTabKeys.clinical,
  addClientTabKeys.careCoordination,
  addClientTabKeys.financials,
  addClientTabKeys.documents,
]

const ssnDisplayValue = computed(() => {
  const digits = normalizeSsnDigits(form.value[ck.socialSecurityNumber])
  if (ssnEditing.value) {
    return digits
  }

  return digits.length ? formatSsnMasked(digits) : ''
})

const activeTabLabel = computed(() => tabLabelFor(activeTab.value))

watch(activeTab, () => {
  emit('tab-label', activeTabLabel.value)
}, { immediate: true })

watch(activeTab, onActiveTabChange)

async function onActiveTabChange(newTab, oldTab) {
  if (newTab === oldTab) {
    return
  }
  if (!isTabEnabled(newTab)) {
    activeTab.value = oldTab

    return
  }
  const newIdx = tabIndex(newTab)
  const oldIdx = tabIndex(oldTab)
  if (newIdx > oldIdx) {
    await validateTabsThrough(newIdx)
  }
}

onMounted(() => {
  resetForm()
  successVisible.value = false
  markPristine()
})

function requiredLabel(text) {
  return `${text} *`
}

function onSsnFocus() {
  ssnEditing.value = true
}

function onSsnInput(val) {
  form.value[ck.socialSecurityNumber] = normalizeSsnDigits(val)
}

function onSsnBlur() {
  ssnEditing.value = false
  form.value[ck.socialSecurityNumber] = normalizeSsnDigits(
    form.value[ck.socialSecurityNumber],
  )
}

async function onNext() {
  const ok = await validateCurrentTabAndUnlock()
  if (!ok) {
    return
  }
  goNextTab()
}

async function onSave() {
  const fmhIdx = tabIndex(addClientTabKeys.familyMedicalHistory)
  const ok = await validateTabsThrough(fmhIdx + 1)
  if (!ok) {
    return
  }

  saving.value = true
  successVisible.value = false
  try {
    await siteStore.createClient(form.value, t)
    successVisible.value = true
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clientSavedSuccess'),
      position: 'top',
    })
    emit('saved')
    markPristine()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const msg = error?.response?.data?.message
        || error?.message
        || t('clientSaveError')
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: String(msg),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
  }
}

function dismissCancelConfirm() {
  cancelConfirmOpen.value = false
}

function confirmDiscard() {
  cancelConfirmOpen.value = false
  emit('cancel')
}

function requestClose() {
  if (isDirty()) {
    cancelConfirmOpen.value = true

    return
  }
  emit('cancel')
}

defineExpose({
  requestClose,
  onSave,
  onNext,
  goPreviousTab,
  canGoNext,
  canGoPrevious,
  saving,
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.client-number-badge {
  background: $surface-muted;
  border-radius: $radius-md;
  flex-shrink: 0;
}

@media (max-width: 599px) {
  .add-client-form__tabs-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .client-number-badge {
    align-self: flex-start;
  }
}
</style>
