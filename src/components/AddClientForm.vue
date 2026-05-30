<template>
  <div class="add-client-form">
    <q-inner-loading :showing="initialLoading" color="primary">
      <q-spinner size="42px" />
    </q-inner-loading>
    <q-banner
        v-if="successVisible"
        dense
        class="bg-positive text-white text-center q-mb-md rounded-borders">
        {{ saveSuccessMessage }}
      </q-banner>

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
          :icon="subTab.icon"
          :label="t(subTab.labelKey)"
        />
      </q-tabs>
    </div>

    <div class="add-client-form__panel-scroll">
      <q-form
        ref="formRef"
        greedy
        novalidate
        autocomplete="off"
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
            :title="t('personalInformation')">
            <div class="row q-col-gutter-sm q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.firstName]"
                    letters-only
                    :maxlength="clientNameMaxLength"
                    :label="requiredLabel(t('firstName'))"
                    :rules="rules.firstName"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.middleName]"
                    letters-only
                    :maxlength="clientNameMaxLength"
                    :label="t('middleName')"
                    :rules="rules.middleName"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.lastName]"
                    letters-only
                    :maxlength="clientNameMaxLength"
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
                    :loading="catalogsLoading"
                    :options="suffixSelectOptions"
                    :label="t('suffix')"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <ClientDateField
                    v-model="form[ck.dob]"
                    max-today
                    :min-year="dobMinYear"
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
                        class="add-client-form__age-input"
                        outlined
                        hide-bottom-space
                        type="number"
                        step="1"
                        :label="t('age')"
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
                    </div>
                    <div class="col-6">
                      <q-select
                        v-model="form[ck.ageUnit]"
                        outlined
                        hide-bottom-space
                        emit-value
                        map-options
                        :loading="catalogsLoading"
                        :options="ageUnitSelectOptions"
                        :label="t('ageUnit')"
                        :rules="rules.ageUnit"
                        :readonly="ageFieldsLocked"
                        :disable="ageFieldsLocked"
                        :key="`age-unit-${catalogsLoaded}-${form[ck.ageUnit]}`"
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
                      :disable="catalogsLoading"
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
          </AddClientAccordionSection>

          <q-separator class="add-client-form__section-separator" />

          <AddClientAccordionSection
            icon="admin_panel_settings"
            :title="t('administrativeInformation')">
            <div class="row q-col-gutter-sm q-col-gutter-md">
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
          </AddClientAccordionSection>
        </q-tab-panel>

        <q-tab-panel
          :name="addClientTabKeys.contact"
          class="q-pa-none"
          :data-add-client-tab="addClientTabKeys.contact">
          <AddClientContactTab
            v-model="form[contactSectionKey]"
            :rules="contactRules"
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
          class="q-pa-none">
          <div class="text-body1 text-grey-7 q-py-xl text-center">
            {{ t('tabComingSoon') }}
          </div>
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
          :label="t('next')"
          :disable="saving"
          @click="onNext"
        />
      </footer>
    </div>

    <ModalComponent
      v-model="cancelConfirmOpen"
      :title="cancelModalTitle"
      :message="cancelModalMessage"
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
import AddClientAllergiesTab from 'components/AddClientAllergiesTab.vue'
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
} from 'src/composables/useAddClientSubTabs.js'

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
  sexOptions,
  suffixSelectOptions,
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
} = useAddClientForm(t, catalogs, { allergiesTabRef, fmhTabRef })

const dobMinYear = computed(
  () => new Date().getFullYear() - clientMaxAge,
)

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

watch([activeTab, activeSubTab], () => {
  emit('tab-label', activeTabLabel.value)
}, { immediate: true })

function loadClientForEdit() {
  const id = props.clientId
  if (id == null || id === '') {
    throw new Error(t('clientLoadError'))
  }
  const mapped = siteStore.buildEditFormFromListClient(id, {
    resolveAgeUnitCode: catalogs.resolveAgeUnitCode,
    defaultAgeUnitValue: catalogs.defaultAgeUnitValue,
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

