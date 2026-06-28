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
      <div
        ref="panelScrollRef"
        class="panel-scroll">
        <q-form
          ref="formRef"
          greedy
          novalidate
          autocomplete="off"
          @submit.prevent>
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
                :credential-options="credentialOptions"
                :specialty-options="specialtyOptions"
                :supervisor-options="supervisorOptions"
                :field-errors="fieldErrors"
              />
            </q-tab-panel>

            <q-tab-panel name="employment" class="q-pa-none">
              <StaffEmploymentTab
                v-model="form.employment"
                :readonly="readonly"
                :position-options="positionOptions"
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
              :label="t('next')"
              @click="goNextTab"
            />
          </footer>
        </q-form>
      </div>
    </div>

    <ModalComponent
      v-model="positionChangeConfirmOpen"
      test-id="staff-position-change"
      :title="t('staffPositionChangeTitle')"
      :message="t('staffPositionChangeMessage')"
      :confirm-text="t('staffPositionChangeConfirm')"
      :cancel-text="t('cancel')"
      @confirm="confirmPositionChange"
      @cancel="cancelPositionChange"
    />
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
import ModalComponent from 'components/ModalComponent.vue'
import StaffBasicInfoTab from 'components/staff/StaffBasicInfoTab.vue'
import StaffContactTab from 'components/staff/StaffContactTab.vue'
import StaffEmploymentTab from 'components/staff/StaffEmploymentTab.vue'
import StaffSystemAccessTab from 'components/staff/StaffSystemAccessTab.vue'
import StaffClinicalProfileTab from
  'components/staff/StaffClinicalProfileTab.vue'
import { staffEntryPoints } from 'components/constants.js'
import { fetchStaffPositionIsClinical } from 'src/utils/staff-api.js'
import {
  createEmptyStaffClinical,
} from 'src/utils/staff-form.js'
import { prefillStaffFormFromNpiLookup } from 'src/utils/staff-npi-lookup.js'
import {
  emailTypeSelectOptions,
  phoneTypeSelectOptions,
} from 'src/utils/client-contact-select-options.js'

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

const formRef = ref(null)
const panelScrollRef = ref(null)
const activeTab = ref('basic')
const positionIsClinical = ref(false)
const positionChangeConfirmOpen = ref(false)
const pendingPositionChange = ref(null)

const form = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const isClinicianEntry = computed(() =>
  props.entryPoint === staffEntryPoints.addClinician,
)

const showClinicalProfileTab = computed(() =>
  isClinicianEntry.value || positionIsClinical.value,
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
    key: 'clinical',
    icon: 'medical_services',
    label: t('tabStaffClinicalProfile'),
    visible: showClinicalProfileTab.value,
  },
  {
    key: 'employment',
    icon: 'work',
    label: t('tabStaffEmployment'),
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

async function resolvePositionClinical(code) {
  if (isClinicianEntry.value) {
    positionIsClinical.value = true
    return
  }
  const trimmed = String(code ?? '').trim()
  if (!trimmed) {
    positionIsClinical.value = false
    return
  }
  try {
    positionIsClinical.value = await fetchStaffPositionIsClinical(trimmed)
  } catch {
    const match = props.positionOptions.find(
      opt => String(opt.value) === trimmed,
    )
    positionIsClinical.value = Boolean(match?.is_clinical ?? match?.isClinical)
  }
}

watch(
  () => form.value.employment?.position,
  async(code, prev) => {
    const wasClinical = positionIsClinical.value
    await resolvePositionClinical(code)
    const becameNonClinical = wasClinical && !positionIsClinical.value
    if (
      becameNonClinical
      && !isClinicianEntry.value
      && hasClinicalData()
      && code !== prev
    ) {
      pendingPositionChange.value = { newCode: code, prevCode: prev }
      form.value = {
        ...form.value,
        employment: {
          ...form.value.employment,
          position: prev ?? '',
        },
      }
      await resolvePositionClinical(prev ?? '')
      positionChangeConfirmOpen.value = true
    }
  },
  { immediate: true },
)

watch(showClinicalProfileTab, visible => {
  if (!visible && activeTab.value === 'clinical') {
    activeTab.value = 'contact'
  }
})

watch(showSystemAccessTab, visible => {
  if (!visible && activeTab.value === 'systemAccess') {
    activeTab.value = 'employment'
  }
})

function hasClinicalData() {
  const clinical = form.value.clinical ?? {}
  return Boolean(
    clinical.npi
    || clinical.credential
    || clinical.primarySpecialty
    || clinical.taxonomies?.length
    || clinical.licenses?.length,
  )
}

function confirmPositionChange() {
  const pending = pendingPositionChange.value
  if (pending?.newCode != null) {
    form.value = {
      ...form.value,
      employment: {
        ...form.value.employment,
        position: pending.newCode,
      },
      clinical: createEmptyStaffClinical(),
    }
    resolvePositionClinical(pending.newCode)
  }
  positionChangeConfirmOpen.value = false
  pendingPositionChange.value = null
}

function cancelPositionChange() {
  positionChangeConfirmOpen.value = false
  pendingPositionChange.value = null
}

function onNpiLookupResult(result) {
  if (!result?.found) {
    return
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
  })
}

function focusTabForField(field) {
  const basicFields = ['firstName', 'lastName', 'dob', 'sex']
  const employmentFields = ['position', 'hireDate']
  const systemAccessFields = [
    'email',
    'password',
    'status',
    'roles',
    'username',
    'roleId',
  ]
  if (basicFields.includes(field)) {
    activeTab.value = 'basic'
  } else if (systemAccessFields.includes(field)) {
    activeTab.value = 'systemAccess'
  } else if (employmentFields.includes(field)) {
    activeTab.value = 'employment'
  } else if (field === 'npi') {
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
