<template>
  <div class="add-client-form">
    <div class="chrome">
      <div class="tabs-row">
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
            v-for="tab in visibleTabs"
            :key="tab.key"
            :name="tab.key"
            :data-testid="staffFormTestIds.tab(tab.key)"
            :class="{ 'add-client-tab--active': activeTab === tab.key }">
            <span class="label row items-center no-wrap">
              <q-icon :name="tab.icon" size="18px" class="icon" />
              <span class="text">{{ tab.label }}</span>
            </span>
          </q-tab>
        </q-tabs>
      </div>
    </div>

    <div class="content">
      <q-form
        ref="formRef"
        greedy
        novalidate
        autocomplete="off"
        class="add-client-form__form"
        @submit.prevent>
        <div
          ref="panelScrollRef"
          class="panel-scroll">
          <q-tab-panels
            v-model="activeTab"
            keep-alive
            animated
            class="bg-transparent">
            <q-tab-panel name="basic" class="q-pa-none">
              <StaffBasicInfoTab
                v-model="form.basic"
                v-model:system-access-enabled="systemAccessEnabled"
                :show-npi-lookup="isClinicianEntry"
                :readonly="readonly"
                :is-edit-mode="isEditMode"
                :has-existing-system-user="hasExistingSystemUser"
                :can-create-system-user="canCreateSystemUser"
                :prefix-options="prefixOptions"
                :suffix-options="suffixOptions"
                :gender-options="genderOptions"
                :field-errors="fieldErrors"
                @npi-result="onNpiLookupResult"
              />
            </q-tab-panel>

            <q-tab-panel name="contact" class="q-pa-none">
              <StaffContactTab
                v-model="form.contact"
                :readonly="readonly"
                :state-options="stateOptions"
              />
            </q-tab-panel>

            <q-tab-panel
              v-if="showClinicalProfileTab"
              name="clinical"
              class="q-pa-none">
              <StaffClinicalProfileTab
                v-model="form.clinical"
                :readonly="readonly"
                :npi-readonly="Boolean(form.basic?.npiLookupFound)"
                :credential-options="credentialOptions"
                :supervisor-options="supervisorOptions"
                :state-options="stateOptions"
                :staff-id="props.staffId"
                :field-errors="fieldErrors"
              />
            </q-tab-panel>

            <q-tab-panel name="employment" class="q-pa-none">
              <StaffEmploymentTab
                v-model="form.employment"
                :readonly="readonly"
                :position-options="positionOptions"
                :specialty-options="specialtyOptions"
                :provider-type-options="providerTypeOptions"
                :field-errors="fieldErrors"
              />
            </q-tab-panel>

            <q-tab-panel
              v-if="showSystemAccessTab"
              name="systemAccess"
              class="q-pa-none">
              <StaffSystemAccessTab
                v-model="form.employment.systemUser"
                :readonly="readonly"
                :is-edit="isEditMode"
                :field-errors="fieldErrors"
              />
            </q-tab-panel>
          </q-tab-panels>
        </div>

          <footer
            v-if="canGoPrevious || canGoNext"
            class="nav-footer row items-center">
            <q-btn
              v-if="canGoPrevious"
              no-caps
              outline
              color="primary"
              icon="arrow_back"
              class="app-btn-outline nav-btn"
              :data-testid="staffFormTestIds.previous"
              :label="t('previous')"
              @click="goPreviousTab"
            />
            <q-space
              v-if="canGoPrevious && canGoNext"
            />
            <q-btn
              v-if="canGoNext"
              no-caps
              outline
              color="primary"
              icon-right="arrow_forward"
              class="app-btn-outline nav-btn"
              :class="{ 'q-ml-auto': !canGoPrevious }"
              :data-testid="staffFormTestIds.next"
              :label="t('next')"
              @click="goNextTab"
            />
          </footer>
        </q-form>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import StaffBasicInfoTab from 'components/staff/StaffBasicInfoTab.vue'
import StaffContactTab from 'components/staff/StaffContactTab.vue'
import StaffEmploymentTab from 'components/staff/StaffEmploymentTab.vue'
import StaffSystemAccessTab from 'components/staff/StaffSystemAccessTab.vue'
import StaffClinicalProfileTab from
  'components/staff/StaffClinicalProfileTab.vue'
import {
  quasarNotifyTypes,
  staffEntryPoints,
} from 'components/constants.js'
import { staffHasExistingSystemUser } from 'src/utils/staff-form.js'
import {
  extractTaxonomiesFromNpiLookup,
  prefillStaffFormFromNpiLookup,
} from 'src/utils/staff-npi-lookup.js'
import { resolveTaxonomiesAgainstCatalog } from
  'src/utils/provider-taxonomy-api.js'
import { fetchLicenseTypes } from 'src/utils/staff-license-api.js'
import { staffFormTestIds } from 'src/test-ids/index.js'
import {
  emailTypeSelectOptions,
  phoneTypeSelectOptions,
} from 'src/utils/client-contact-select-options.js'
import {
  findSpecialtyOption,
  specialtyHasClinicianCapability,
} from 'src/utils/specialty-api.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  entryPoint: {
    type: String,
    required: true,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  staffId: {
    type: [Number, String],
    default: null,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  canCreateSystemUser: {
    type: Boolean,
    default: false,
  },
  prefixOptions: {
    type: Array,
    default: () => [],
  },
  suffixOptions: {
    type: Array,
    default: () => [],
  },
  genderOptions: {
    type: Array,
    default: () => [],
  },
  stateOptions: {
    type: Array,
    default: () => [],
  },
  positionOptions: {
    type: Array,
    default: () => [],
  },
  credentialOptions: {
    type: Array,
    default: () => [],
  },
  specialtyOptions: {
    type: Array,
    default: () => [],
  },
  providerTypeOptions: {
    type: Array,
    default: () => [],
  },
  supervisorOptions: {
    type: Array,
    default: () => [],
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'update:activeTabLabel'])

const { t } = useI18n()
const $q = useQuasar()

const formRef = ref(null)
const panelScrollRef = ref(null)
const activeTab = ref('basic')

const form = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const isClinicianRecord = computed(() => Boolean(form.value.isClinician))

const isClinicianEntry = computed(() =>
  props.entryPoint === staffEntryPoints.addClinician
  || isClinicianRecord.value,
)

const isAddClinicianCreate = computed(() =>
  !props.isEditMode
  && props.entryPoint === staffEntryPoints.addClinician,
)

const selectedSpecialty = computed(() => findSpecialtyOption(
  props.specialtyOptions,
  form.value.employment?.specialtyId,
))

const selectedSpecialtyIsClinical = computed(() => {
  const specialty = selectedSpecialty.value
  if (!specialty) {
    return false
  }

  return specialtyHasClinicianCapability(specialty)
})

const showClinicalProfileTab = computed(() =>
  isAddClinicianCreate.value || selectedSpecialtyIsClinical.value,
)

const systemAccessEnabled = computed({
  get: () => Boolean(form.value.employment?.systemUser?.enabled),
  set: enabled => {
    form.value = {
      ...form.value,
      employment: {
        ...form.value.employment,
        systemUser: {
          ...form.value.employment.systemUser,
          enabled,
        },
      },
    }
  },
})

const hasExistingSystemUser = computed(() =>
  staffHasExistingSystemUser(form.value.employment?.systemUser),
)

const showSystemAccessTab = computed(() => systemAccessEnabled.value)

const tabDefs = computed(() => [
  {
    key: 'basic',
    icon: 'person',
    label: t('tabStaffBasicInformation'),
  },
  {
    key: 'contact',
    icon: 'contact_phone',
    label: t('tabStaffContactInformation'),
  },
  {
    key: 'employment',
    icon: 'work',
    label: t('tabStaffEmployment'),
  },
  {
    key: 'clinical',
    icon: 'medical_services',
    label: t('tabStaffClinicalProfile'),
    visible: showClinicalProfileTab.value,
  },
  {
    key: 'systemAccess',
    icon: 'admin_panel_settings',
    label: t('tabStaffSystemAccess'),
    visible: showSystemAccessTab.value,
  },
])

const visibleTabs = computed(() =>
  tabDefs.value.filter(tab => tab.visible !== false),
)

const activeTabLabel = computed(() =>
  visibleTabs.value.find(tab => tab.key === activeTab.value)?.label ?? '',
)

const activeTabIndex = computed(() =>
  visibleTabs.value.findIndex(tab => tab.key === activeTab.value),
)

const canGoPrevious = computed(() => activeTabIndex.value > 0)

const canGoNext = computed(() => {
  const index = activeTabIndex.value
  const list = visibleTabs.value

  return index >= 0 && index < list.length - 1
})

const nextTab = computed(() => {
  const list = visibleTabs.value
  const index = activeTabIndex.value
  if (index < 0 || index >= list.length - 1) {
    return null
  }

  return list[index + 1]
})

function goPreviousTab() {
  const index = activeTabIndex.value
  if (index > 0) {
    activeTab.value = visibleTabs.value[index - 1].key
  }
}

function goNextTab() {
  const next = nextTab.value
  if (next) {
    activeTab.value = next.key
  }
}

function scrollFormPanelToTop() {
  nextTick(() => {
    const el = panelScrollRef.value
    if (el) {
      el.scrollTop = 0
    }
  })
}

watch(activeTabLabel, label => {
  emit('update:activeTabLabel', label)
}, { immediate: true })

watch(activeTab, () => {
  scrollFormPanelToTop()
})

watch(
  () => [
    form.value.employment?.specialtyId,
    props.specialtyOptions,
  ],
  () => {
    syncSpecialtySelection()
  },
  { immediate: true },
)

function syncSpecialtySelection() {
  const employment = form.value.employment ?? {}
  const specialtyId = employment.specialtyId
  const match = findSpecialtyOption(props.specialtyOptions, specialtyId)
  if (specialtyId != null && specialtyId !== '' && !match) {
    return
  }
  if (!match) {
    if (employment.specialtyName) {
      form.value = {
        ...form.value,
        employment: {
          ...employment,
          specialtyName: '',
        },
      }
    }
    return
  }
  const specialtyName = match.label ?? ''
  const nextPrimary = match.code || specialtyName
  const clinical = form.value.clinical ?? {}
  const shouldSyncPrimary = specialtyHasClinicianCapability(match)
  const nameChanged = employment.specialtyName !== specialtyName
  const primaryChanged = shouldSyncPrimary
    && clinical.primarySpecialty !== nextPrimary
  if (!nameChanged && !primaryChanged) {
    return
  }
  form.value = {
    ...form.value,
    employment: {
      ...employment,
      specialtyName,
    },
    clinical: shouldSyncPrimary
      ? {
        ...clinical,
        primarySpecialty: nextPrimary,
      }
      : clinical,
  }
}

watch(showClinicalProfileTab, visible => {
  if (!visible && activeTab.value === 'clinical') {
    activeTab.value = 'employment'
  }
})

watch(showSystemAccessTab, visible => {
  if (!visible && activeTab.value === 'systemAccess') {
    activeTab.value = 'employment'
  }
})

async function onNpiLookupResult(result) {
  if (!result?.found) {
    return
  }

  const rawTaxonomies = extractTaxonomiesFromNpiLookup(result)
  let catalogTaxonomies = []
  let missingCodes = []
  if (rawTaxonomies.length) {
    const resolved = await resolveTaxonomiesAgainstCatalog(rawTaxonomies)
    catalogTaxonomies = resolved.taxonomies
    missingCodes = resolved.missingCodes
  }

  form.value = prefillStaffFormFromNpiLookup(form.value, result, {
    phoneTypeOptions: phoneTypeSelectOptions(),
    emailTypeOptions: emailTypeSelectOptions(),
    stateOptions: props.stateOptions,
    prefixOptions: props.prefixOptions,
    suffixOptions: props.suffixOptions,
    genderOptions: props.genderOptions,
    credentialOptions: props.credentialOptions,
    specialtyOptions: props.specialtyOptions,
    licenseTypeOptions: await fetchLicenseTypes(),
    taxonomiesOverride: catalogTaxonomies,
  })

  if (missingCodes.length) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('staffTaxonomyNpiMissingCatalog', {
        codes: missingCodes.join(', '),
      }),
      timeout: 8000,
    })
  }
}

function focusTabForField(field) {
  const basicFields = ['firstName', 'lastName', 'dob', 'sex']
  const employmentFields = ['position', 'hireDate', 'specialtyId']
  const systemAccessFields = [
    'email',
    'password',
    'status',
    'roles',
    'username',
    'roleId',
  ]
  const clinicalFields = ['npi', 'taxonomies', 'supervisorId']
  if (basicFields.includes(field)) {
    activeTab.value = 'basic'
  } else if (systemAccessFields.includes(field)) {
    activeTab.value = 'systemAccess'
  } else if (employmentFields.includes(field)) {
    activeTab.value = 'employment'
  } else if (clinicalFields.includes(field)) {
    activeTab.value = 'clinical'
  }
}

function getIncludeClinicalProfile() {
  return showClinicalProfileTab.value
}

defineExpose({
  activeTab,
  focusTabForField,
  showClinicalProfileTab,
  getIncludeClinicalProfile,
})
</script>
