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
                :show-npi-lookup="isClinicianEntry"
                :readonly="readonly"
                :prefix-options="prefixOptions"
                :suffix-options="suffixOptions"
                :field-errors="fieldErrors"
                @npi-result="onNpiLookupResult"
              />
            </q-tab-panel>

            <q-tab-panel name="contact" class="q-pa-none">
              <StaffContactTab
                v-model="form.contact"
                :readonly="readonly"
                :state-options="stateOptions"
                :phone-type-options="phoneTypeOptions"
                :email-type-options="emailTypeOptions"
              />
            </q-tab-panel>

            <q-tab-panel name="employment" class="q-pa-none">
              <StaffEmploymentTab
                v-model="form.employment"
                :readonly="readonly"
                :role-options="roleOptions"
                :position-options="positionOptions"
                :can-create-system-user="canCreateSystemUser"
                :is-edit="isEditMode"
                :field-errors="fieldErrors"
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
import StaffClinicalProfileTab from
  'components/staff/StaffClinicalProfileTab.vue'
import { staffEntryPoints } from 'components/constants.js'
import { fetchStaffPositionIsClinical } from 'src/utils/staff-api.js'
import {
  createEmptyStaffClinical,
  nextStaffLicenseId,
} from 'src/utils/staff-form.js'
import {
  mapNpiEmailsToStaffContact,
  mapNpiPhonesToStaffContact,
  resolveNpiAddressState,
} from 'src/utils/npi-registry-contact-map.js'

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
  stateOptions: {
    type: Array,
    default: () => [],
  },
  phoneTypeOptions: {
    type: Array,
    default: () => [],
  },
  emailTypeOptions: {
    type: Array,
    default: () => [],
  },
  positionOptions: {
    type: Array,
    default: () => [],
  },
  roleOptions: {
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

function mapNpiLicenses(rows) {
  return (rows ?? []).map(row => ({
    id: nextStaffLicenseId(),
    type: row.type ?? '',
    identifier: row.identifier ?? '',
    expirationDate: row.expirationDate ?? row.expiration_date ?? '',
    status: row.status ?? 'Active',
    attachmentFileId: row.attachmentFileId ?? null,
    isPrimary: Boolean(row.isPrimary ?? row.is_primary),
  }))
}

function onNpiLookupResult(result) {
  if (!result?.found) {
    return
  }
  const npiLicenses = mapNpiLicenses(result.licenses)
  const npiPhones = result.phones?.length
    ? result.phones
    : result.phone
      ? [{ number: result.phone, kind: 'telephone' }]
      : []
  const mappedPhones = mapNpiPhonesToStaffContact(
    npiPhones,
    props.phoneTypeOptions,
  )
  const mappedEmails = result.emails?.length
    ? mapNpiEmailsToStaffContact(
      result.emails,
      props.emailTypeOptions,
    )
    : form.value.contact.emails
  const resolvedState = resolveNpiAddressState(
    result.practice_address?.state,
    props.stateOptions,
  )
  form.value = {
    ...form.value,
    basic: {
      ...form.value.basic,
      prefix: result.prefix ?? result.name_prefix ?? form.value.basic.prefix,
      npiLookup: result.npi ?? form.value.basic.npiLookup,
      npiLookupFound: true,
    },
    clinical: {
      ...form.value.clinical,
      npi: result.npi ?? form.value.clinical.npi,
      credential: result.credential ?? form.value.clinical.credential,
      primarySpecialty:
        result.primary_specialty ?? form.value.clinical.primarySpecialty,
      taxonomies: (result.taxonomies ?? []).map(row => ({
        code: row.code ?? '',
        displayName: row.display_name ?? row.displayName ?? '',
        isPrimary: Boolean(row.is_primary ?? row.isPrimary),
      })),
      licenses: npiLicenses.length
        ? npiLicenses
        : form.value.clinical.licenses,
    },
    contact: {
      ...form.value.contact,
      address: {
        ...form.value.contact.address,
        address:
          result.practice_address?.address
          ?? form.value.contact.address.address,
        address2:
          result.practice_address?.address2
          ?? form.value.contact.address.address2,
        city:
          result.practice_address?.city
          ?? form.value.contact.address.city,
        state: resolvedState || form.value.contact.address.state,
        zipCode:
          result.practice_address?.zip_code
          ?? form.value.contact.address.zipCode,
        country:
          result.practice_address?.country
          ?? form.value.contact.address.country,
      },
      phones: mappedPhones,
      emails: mappedEmails,
    },
  }
}

function focusTabForField(field) {
  const basicFields = ['firstName', 'lastName', 'dob', 'sex']
  const employmentFields = [
    'position',
    'hireDate',
    'username',
    'roleId',
    'password',
  ]
  if (basicFields.includes(field)) {
    activeTab.value = 'basic'
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
