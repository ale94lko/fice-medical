<template>
  <div class="add-client-form" :data-testid="tid.form">
    <q-inner-loading :showing="initialLoading" color="primary">
      <q-spinner size="42px" />
    </q-inner-loading>
    <div class="add-client-form__chrome">
      <div class="add-client-form__tabs-row">
        <q-tabs
        v-model="activeTab"
        dense
        no-caps
        outside-arrows
        mobile-arrows
        class="add-client-tabs"
        active-color="white"
        indicator-color="transparent"
        align="left">
        <q-tab
          v-for="tab in mainTabs"
          :key="tab.key"
          :name="tab.key"
          :data-testid="tid.tab(tab.key)"
          :class="mainTabClass(tab)">
          <span class="add-client-tab__label row items-center no-wrap">
            <q-icon
              :name="tab.icon"
              size="18px"
              class="add-client-tab__icon"
            />
            <span class="add-client-tab__text">{{ t(tab.labelKey) }}</span>
            <span
              v-if="tabErrorCount(tab.key) > 0"
              class="add-client-tab__error-badge"
              :aria-label="t('tabErrorCountAria', {
                count: tabErrorCount(tab.key),
              })">
              {{ tabErrorCount(tab.key) }}
            </span>
            <q-icon
              v-if="tab.hasSubTabs"
              name="arrow_drop_down"
              size="18px"
              class="add-client-tab__chevron q-ml-xs"
            />
          </span>
        </q-tab>
      </q-tabs>
      </div>

      <div
        v-if="hasSubTabs"
        class="add-client-form__subtabs-row">
      <q-tabs
        v-model="activeSubTab"
        dense
        no-caps
        outside-arrows
        mobile-arrows
        class="add-client-subtabs"
        active-color="primary"
        indicator-color="primary"
        align="left">
        <q-tab
          v-for="subTab in currentSubTabs"
          :key="subTab.key"
          :name="subTab.key"
          :data-testid="tid.subTab(subTab.key)"
          :icon="subTab.icon"
          :label="t(subTab.labelKey)"
        />
      </q-tabs>
      </div>
    </div>

    <div
      ref="panelScrollRef"
      class="add-client-form__panel-scroll">
      <q-banner
        v-if="successVisible"
        dense
        class="bg-positive text-white text-center q-mb-md rounded-borders">
        {{ saveSuccessMessage }}
      </q-banner>

      <q-form
        ref="formRef"
        greedy
        novalidate
        autocomplete="off"
        :data-testid="tid.formFields"
        @submit.prevent="onSave">
        <q-tab-panels
          v-model="activeTab"
          keep-alive
          animated
          class="bg-transparent">
        <q-tab-panel
          :name="addClientTabKeys.basic"
          class="q-pa-none"
          :data-add-client-tab="addClientTabKeys.basic">
          <AddClientAccordionSection
            icon="person"
            :title="t('personalInformation')"
            section-test-id="add-client-accordion-personal-information"
            :toggle-test-id="tid.accordionToggle('personal-information')">
            <div class="row q-col-gutter-sm q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('prefix')"
                    :test-id="tid.field(ck.prefix)">
                    <FormSelect
                      v-model="form[ck.prefix]"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :loading="catalogsLoading"
                      :options="prefixSelectOptions"
                      :placeholder="t('prefixSelect')"
                      :test-id="tid.field(ck.prefix)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.firstName]"
                    :external-label="true"
                    letters-only
                    :maxlength="clientNameMaxLength"
                    :label="requiredLabel(t('firstName'))"
                    :rules="rules.firstName"
                    :test-id="tid.field(ck.firstName)"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.middleName]"
                    :external-label="true"
                    letters-only
                    :maxlength="clientNameMaxLength"
                    :label="t('middleName')"
                    :rules="rules.middleName"
                    :test-id="tid.field(ck.middleName)"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.lastName]"
                    :external-label="true"
                    letters-only
                    :maxlength="clientNameMaxLength"
                    :label="requiredLabel(t('lastName'))"
                    :rules="rules.lastName"
                    :test-id="tid.field(ck.lastName)"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('suffix')"
                    :test-id="tid.field(ck.suffix)">
                    <FormSelect
                      v-model="form[ck.suffix]"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :loading="catalogsLoading"
                      :options="suffixSelectOptions"
                      :placeholder="t('suffixSelect')"
                      :test-id="tid.field(ck.suffix)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('socialSecurityNumber')"
                    :test-id="tid.field(ck.socialSecurityNumber)">
                    <q-input
                      outlined
                      hide-bottom-space
                      class="full-width"
                      :data-testid="tid.field(ck.socialSecurityNumber)"
                      :model-value="ssnDisplayValue"
                      :rules="rules.ssn"
                      maxlength="11"
                      @focus="onSsnFocus"
                      @blur="onSsnBlur"
                      @update:model-value="onSsnInput"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('dob')"
                    :test-id="tid.field(ck.dob)">
                    <ClientDateField
                      v-model="form[ck.dob]"
                      max-today
                      :min-year="dobMinYear"
                      :rules="rules.dob"
                      :close-label="t('close')"
                      :test-id="tid.field(ck.dob)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <div class="row q-col-gutter-sm">
                    <div class="col-6">
                      <AddClientLabeledField
                        :label="t('age')"
                        :test-id="tid.field(ck.age)">
                        <q-input
                          v-model="form[ck.age]"
                          class="add-client-form__age-input"
                          outlined
                          hide-bottom-space
                          :data-testid="tid.field(ck.age)"
                          type="number"
                          step="1"
                          :rules="rules.age"
                          :readonly="ageFieldsLocked"
                          :disable="ageFieldsLocked"
                          :filled="ageFieldsLocked"
                          min="0"
                          :max="ageMaxForUnit"
                          @update:model-value="onAgeInput"
                        >
                        <template v-if="!ageFieldsLocked" #append>
                          <div
                            class="add-client-form__age-stepper"
                            role="group"
                            :aria-label="t('age')">
                            <button
                              type="button"
                              class="add-client-form__age-stepper-btn"
                              :disabled="ageAtMax"
                              :aria-label="t('ageIncrement')"
                              @click.stop="bumpAge(1)">
                              <q-icon name="expand_less" size="18px" />
                            </button>
                            <span
                              class="add-client-form__age-stepper-divider"
                              aria-hidden="true" />
                            <button
                              type="button"
                              class="add-client-form__age-stepper-btn"
                              :disabled="ageAtMin"
                              :aria-label="t('ageDecrement')"
                              @click.stop="bumpAge(-1)">
                              <q-icon name="expand_more" size="18px" />
                            </button>
                          </div>
                        </template>
                        </q-input>
                      </AddClientLabeledField>
                    </div>
                    <div class="col-6">
                      <AddClientLabeledField
                        :label="t('ageUnit')"
                        :test-id="tid.field(ck.ageUnit)">
                        <FormSelect
                          v-model="form[ck.ageUnit]"
                          outlined
                          hide-bottom-space
                          emit-value
                          map-options
                          class="full-width"
                          :loading="catalogsLoading"
                          :options="ageUnitSelectOptions"
                          :rules="rules.ageUnit"
                          :readonly="ageFieldsLocked"
                          :disable="ageFieldsLocked"
                          :test-id="tid.field(ck.ageUnit)"
                          :key="
                            `age-unit-${catalogsLoaded}-${form[ck.ageUnit]}`
                          "
                        />
                      </AddClientLabeledField>
                    </div>
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('race')"
                    :test-id="tid.field(ck.race)">
                    <FormSelect
                      v-model="form[ck.race]"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :loading="catalogsLoading"
                      :options="raceSelectOptions"
                      :placeholder="t('raceSelect')"
                      :test-id="tid.field(ck.race)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('ethnicity')"
                    :test-id="tid.field(ck.ethnicity)">
                    <FormSelect
                      v-model="form[ck.ethnicity]"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :loading="catalogsLoading"
                      :options="ethnicitySelectOptions"
                      :placeholder="t('ethnicitySelect')"
                      :test-id="tid.field(ck.ethnicity)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12">
                  <AddClientLabeledField
                    :label="t('gender')"
                    :test-id="tid.field(ck.gender)">
                    <div
                      class="add-client-form__gender-chip-grid"
                      :style="genderChipGridStyle">
                      <q-btn
                        v-for="opt in genderOptions"
                        :key="opt.value"
                        flat
                        no-caps
                        :disable="catalogsLoading"
                        :data-testid="tid.genderOption(opt.value)"
                        :class="genderChipClass(opt.value)"
                        @click="form[ck.gender] = opt.value">
                        <span :class="genderDotClass(opt.value)" />
                        <span class="add-client-form__gender-chip-label">
                          {{ opt.label }}
                        </span>
                      </q-btn>
                    </div>
                  </AddClientLabeledField>
                </div>
              </div>
          </AddClientAccordionSection>

          <q-separator class="add-client-form__section-separator" />

          <AddClientAccordionSection
            icon="admin_panel_settings"
            :title="t('administrativeInformation')"
            section-test-id="add-client-accordion-administrative-information"
            :toggle-test-id="
              tid.accordionToggle('administrative-information')">
            <div class="row q-col-gutter-sm q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="requiredLabel(t('admissionDate'))"
                    :test-id="tid.field(ck.admissionDate)">
                    <ClientDateField
                      v-model="form[ck.admissionDate]"
                      :rules="rules.admissionDate"
                      :max-today="true"
                      :close-label="t('close')"
                      :test-id="tid.field(ck.admissionDate)"
                    />
                  </AddClientLabeledField>
                </div>
                <div class="col-12 col-md-6">
                  <AddClientLabeledField
                    :label="t('assignedClinician')"
                    :test-id="tid.field(ck.assignedClinician)">
                    <FormSelect
                      v-model="form[ck.assignedClinician]"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      use-input
                      class="full-width"
                      input-debounce="0"
                      :options="assignedClinicianOptions"
                      :test-id="tid.field(ck.assignedClinician)"
                    />
                  </AddClientLabeledField>
                </div>
              </div>
          </AddClientAccordionSection>
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.contact"
          class="q-pa-none"
          :data-add-client-tab="addClientTabKeys.contact">
          <AddClientContactTab
            v-model="form[contactSectionKey]"
            :rules="contactRules"
            :prefix-select-options="prefixSelectOptions"
            :suffix-select-options="suffixSelectOptions"
            :catalogs-loading="catalogsLoading"
          />
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.allergies"
          class="q-pa-none"
          :data-add-client-tab="addClientTabKeys.allergies">
          <AddClientAllergiesTab
            ref="allergiesTabRef"
            v-model="form[clientFormSections.allergies]"
          />
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.insurance"
          class="q-pa-none"
          :data-add-client-tab="addClientTabKeys.insurance">
          <AddClientInsuranceTab
            v-model="form[clientFormSections.insurance]"
            :patient-name="patientFullName"
          />
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.assessments"
          class="q-pa-none">
          <div class="text-body1 text-grey-7 q-py-xl text-center">
            {{ t('tabComingSoon') }}
          </div>
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.clinical"
          class="q-pa-none">
          <q-tab-panels
            v-model="activeSubTab"
            animated
            class="bg-transparent add-client-form__sub-panels">
            <q-tab-panel
              v-for="subTab in clinicalSubTabs"
              :key="subTab.key"
              :name="subTab.key"
              class="q-pa-none">
              <AddClientFamilyMedicalHistoryTab
                v-if="subTab.key === CLINICAL_FAMILY_HISTORY_SUB_TAB"
                ref="fmhTabRef"
                v-model="form[clientFormSections.familyMedicalHistory]"
              />
              <AddClientVitalsTab
                v-else-if="subTab.key === CLINICAL_VITALS_SUB_TAB"
                ref="vitalsTabRef"
                v-model="form[clientFormSections.vitals]"
                :clinician-options="assignedClinicianOptions"
              />
              <div
                v-else
                class="text-body1 text-grey-7 q-py-xl text-center">
                {{ t('tabComingSoon') }}
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.careCoordination"
          class="q-pa-none">
          <q-tab-panels
            v-model="activeSubTab"
            animated
            class="bg-transparent add-client-form__sub-panels">
            <q-tab-panel
              v-for="subTab in careCoordinationSubTabs"
              :key="subTab.key"
              :name="subTab.key"
              class="q-pa-none">
              <div class="text-body1 text-grey-7 q-py-xl text-center">
                {{ t('tabComingSoon') }}
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.financials"
          class="q-pa-none">
          <q-tab-panels
            v-model="activeSubTab"
            animated
            class="bg-transparent add-client-form__sub-panels">
            <q-tab-panel
              v-for="subTab in financialsSubTabs"
              :key="subTab.key"
              :name="subTab.key"
              class="q-pa-none">
              <div class="text-body1 text-grey-7 q-py-xl text-center">
                {{ t('tabComingSoon') }}
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.documents"
          class="q-pa-none">
          <q-tab-panels
            v-model="activeSubTab"
            animated
            class="bg-transparent add-client-form__sub-panels">
            <q-tab-panel
              v-for="subTab in documentsSubTabs"
              :key="subTab.key"
              :name="subTab.key"
              class="q-pa-none">
              <div class="text-body1 text-grey-7 q-py-xl text-center">
                {{ t('tabComingSoon') }}
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-tab-panel>
      </q-tab-panels>
      </q-form>

      <footer
        v-if="canGoPrevious() || canGoNext()"
        class="add-client-form__nav-footer row items-center">
        <q-btn
          v-if="canGoPrevious()"
          no-caps
          outline
          color="primary"
          icon="arrow_back"
          class="app-btn-outline add-client-form__nav-btn"
          :data-testid="tid.btn('previous')"
          :label="t('previous')"
          :disable="saving"
          @click="goPreviousTab"
        />
        <q-space v-if="canGoPrevious() && canGoNext()" />
        <q-btn
          v-if="canGoNext()"
          no-caps
          outline
          color="primary"
          icon-right="arrow_forward"
          class="app-btn-outline add-client-form__nav-btn"
          :class="{ 'q-ml-auto': !canGoPrevious() }"
          :data-testid="tid.btn('next')"
          :label="t('next')"
          :disable="saving"
          @click="onNext"
        />
      </footer>
    </div>

    <ModalComponent
      v-model="cancelConfirmOpen"
      test-id="cancel-discard"
      :title="cancelModalTitle"
      :message="cancelModalMessage"
      :confirm-text="t('keepEditing')"
      :cancel-text="t('discardChanges')"
      :confirm-button-test-id="tid.modalKeepEditing"
      :cancel-button-test-id="tid.modalCancelDiscard"
      @confirm="dismissCancelConfirm"
      @cancel="confirmDiscard"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import TextInput from 'components/TextInput.vue'
import ClientDateField from 'components/ClientDateField.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import ModalComponent from 'components/ModalComponent.vue'
import AddClientContactTab from 'components/AddClientContactTab.vue'
import AddClientFamilyMedicalHistoryTab from
  'components/AddClientFamilyMedicalHistoryTab.vue'
import AddClientVitalsTab from 'components/AddClientVitalsTab.vue'
import AddClientAllergiesTab from 'components/AddClientAllergiesTab.vue'
import AddClientInsuranceTab from 'components/AddClientInsuranceTab.vue'
import AddClientAccordionSection from 'components/AddClientAccordionSection.vue'
import { useSiteStore } from 'stores/site-store.js'
import { useAddClientForm } from 'src/composables/useAddClientForm.js'
import { useAddClientCatalogs } from 'src/composables/useAddClientCatalogs.js'
import {
  addClientTabKeys,
  clientFormSections,
  clientMaxAge,
  clientNameMaxLength,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  formatSsnMasked,
  maxAgeForUnit,
  normalizeSsnDigits,
} from 'src/utils/client-form.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  highestAllergySeverity,
  severityTabModifier,
} from 'src/utils/client-allergies.js'
import {
  ADD_CLIENT_MAIN_TABS,
  ADD_CLIENT_SUB_TABS,
  CLINICAL_FAMILY_HISTORY_SUB_TAB,
  CLINICAL_VITALS_SUB_TAB,
} from 'src/composables/useAddClientSubTabs.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: value => value === 'create' || value === 'edit',
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['saved', 'cancel', 'tab-label'])

const isEditMode = computed(() => props.mode === 'edit')

const $q = useQuasar()
const { t } = useI18n()
const siteStore = useSiteStore()

const saving = ref(false)
const initialLoading = ref(false)
const successVisible = ref(false)
const cancelConfirmOpen = ref(false)
const ssnEditing = ref(false)
const allergiesTabRef = ref(null)
const fmhTabRef = ref(null)
const vitalsTabRef = ref(null)
const panelScrollRef = ref(null)

const catalogs = useAddClientCatalogs(t)
const {
  loading: catalogsLoading,
  loaded: catalogsLoaded,
  loadBasicInfoCatalogs,
} = catalogs

const {
  ck,
  contactSectionKey,
  form,
  formRef,
  activeTab,
  ageFieldsLocked,
  ageUnitSelectOptions,
  assignedClinicianOptions,
  genderOptions,
  prefixSelectOptions,
  suffixSelectOptions,
  raceSelectOptions,
  ethnicitySelectOptions,
  rules,
  contactRules,
  resetForm,
  applyForm,
  markPristine,
  isDirty,
  goNextTab,
  canGoNext,
  goPreviousTab,
  canGoPrevious,
  validateCurrentTabAndUnlock,
  validateAllTabs,
  tabErrorCount,
  tabLabelFor,
  hasSubTabs,
  currentSubTabs,
  activeSubTab,
} = useAddClientForm(t, catalogs, {
  allergiesTabRef,
  fmhTabRef,
  vitalsTabRef,
})

const dobMinYear = computed(
  () => new Date().getFullYear() - clientMaxAge,
)

const genderChipGridStyle = computed(() => {
  const options = genderOptions?.value ?? []
  const count = Math.max(options.length, 1)

  return {
    gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
  }
})

function normalizeGenderToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function genderValuesMatch(stored, optionValue) {
  const a = normalizeGenderToken(stored)
  const b = normalizeGenderToken(optionValue)
  if (!a || !b) {
    return false
  }

  return a === b
}

function genderChipModifier(value) {
  const token = normalizeGenderToken(value)
  if (token === 'male') {
    return 'male'
  }
  if (token === 'female') {
    return 'female'
  }

  return 'unknown'
}

function genderDotClass(value) {
  const modifier = genderChipModifier(value)

  return [
    'add-client-form__gender-chip-dot',
    `add-client-form__gender-chip-dot--${modifier}`,
  ]
}

function genderChipClass(value) {
  const modifier = genderChipModifier(value)

  return [
    'add-client-form__gender-chip',
    `add-client-form__gender-chip--${modifier}`,
    {
      'add-client-form__gender-chip--selected':
        genderValuesMatch(form.value[ck.gender], value),
    },
  ]
}

const ageMaxForUnit = computed(() => maxAgeForUnit(form.value[ck.ageUnit]))

const ageNumericValue = computed(() => {
  const raw = String(form.value[ck.age] ?? '').trim()
  if (!raw) {
    return 0
  }
  const n = Number(raw)

  return Number.isFinite(n) ? n : 0
})

const ageAtMin = computed(() => ageNumericValue.value <= 0)
const ageAtMax = computed(
  () => ageNumericValue.value >= ageMaxForUnit.value,
)

function onAgeInput(val) {
  if (ageFieldsLocked.value) {
    return
  }
  const raw = String(val ?? '').trim()
  if (!raw) {
    form.value[ck.age] = ''

    return
  }
  const n = Number(raw)
  if (!Number.isFinite(n)) {
    return
  }
  form.value[ck.age] = String(Math.max(0, Math.trunc(n)))
}

function bumpAge(delta) {
  const max = ageMaxForUnit.value
  const next = Math.min(max, Math.max(0, ageNumericValue.value + delta))
  form.value[ck.age] = String(next)
}

const mainTabs = ADD_CLIENT_MAIN_TABS

const clinicalSubTabs = ADD_CLIENT_SUB_TABS[addClientTabKeys.clinical]
const careCoordinationSubTabs =
  ADD_CLIENT_SUB_TABS[addClientTabKeys.careCoordination]
const financialsSubTabs = ADD_CLIENT_SUB_TABS[addClientTabKeys.financials]
const documentsSubTabs = ADD_CLIENT_SUB_TABS[addClientTabKeys.documents]

const allergiesTabClass = computed(() => {
  const classes = ['add-client-tab--allergies']
  const top = highestAllergySeverity(
    form.value[clientFormSections.allergies]?.entries,
  )
  const modifier = severityTabModifier(top)
  if (modifier) {
    classes.push(`add-client-tab--allergies-${modifier}`)
  }

  return classes
})

function mainTabClass(tab) {
  if (tab.key === addClientTabKeys.allergies) {
    return allergiesTabClass.value
  }

  return undefined
}

const ssnDisplayValue = computed(() => {
  const digits = normalizeSsnDigits(form.value[ck.socialSecurityNumber])
  if (ssnEditing.value) {
    return digits
  }

  return digits.length ? formatSsnMasked(digits) : ''
})

const activeTabLabel = computed(() => tabLabelFor(activeTab.value))

const patientFullName = computed(() => {
  const parts = [
    form.value[ck.firstName],
    form.value[ck.middleName],
    form.value[ck.lastName],
  ]
    .map(part => String(part ?? '').trim())
    .filter(Boolean)
  const suffix = String(form.value[ck.suffix] ?? '').trim()
  let name = parts.join(' ')
  if (suffix) {
    name = `${name} ${suffix}`.trim()
  }

  return name
})

const cancelModalTitle = computed(() =>
  isEditMode.value
    ? t('cancelClientEditTitle')
    : t('cancelClientRegistrationTitle'),
)

const cancelModalMessage = computed(() =>
  isEditMode.value
    ? t('cancelClientEditMessage')
    : t('cancelClientRegistrationMessage'),
)

const saveSuccessMessage = computed(() =>
  isEditMode.value
    ? t('clientUpdatedSuccess')
    : t('clientSavedSuccess'),
)

function scrollFormPanelToTop() {
  nextTick(() => {
    const el = panelScrollRef.value
    if (el) {
      el.scrollTop = 0
    }
  })
}

watch([activeTab, activeSubTab], () => {
  emit('tab-label', activeTabLabel.value)
  scrollFormPanelToTop()
}, { immediate: true })

async function loadClientForEdit() {
  const id = props.clientId
  if (id == null || id === '') {
    throw new Error(t('clientLoadError'))
  }
  const mapped = await siteStore.buildEditFormForClient(id, {
    resolveAgeUnitCode: catalogs.resolveAgeUnitCode,
    defaultAgeUnitValue: catalogs.defaultAgeUnitValue,
    resolveCatalogSelectValue: catalogs.resolveCatalogSelectValue,
    prefixSelectOptions: prefixSelectOptions.value,
    suffixSelectOptions: suffixSelectOptions.value,
    raceSelectOptions: raceSelectOptions.value,
    ethnicitySelectOptions: ethnicitySelectOptions.value,
    genderSelectOptions: genderOptions.value,
  })
  applyForm(mapped)
}

onMounted(async() => {
  try {
    await loadBasicInfoCatalogs()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const msg = error?.response?.data?.message
        || error?.message
        || t('catalogLoadError')
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: String(msg),
        position: 'top',
      })
    }
  }

  successVisible.value = false

  if (isEditMode.value) {
    initialLoading.value = true
    try {
      await loadClientForEdit()
      markPristine()
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        const msg = error?.response?.data?.message
          || error?.message
          || t('clientLoadError')
        $q.notify({
          type: quasarNotifyTypes.negative,
          message: String(msg),
          position: 'top',
        })
      }
      emit('cancel')
    } finally {
      initialLoading.value = false
    }

    return
  }

  resetForm()
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
  const ok = await validateAllTabs()
  if (!ok) {
    return
  }

  saving.value = true
  successVisible.value = false
  try {
    if (isEditMode.value) {
      await siteStore.updateClient(props.clientId, form.value, t)
    } else {
      await siteStore.createClient(form.value, t)
    }
    successVisible.value = true
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: saveSuccessMessage.value,
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
  initialLoading,
})
</script>

