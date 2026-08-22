<template>
  <q-tabs
    :model-value="modelValue"
    dense
    no-caps
    outside-arrows
    mobile-arrows
    class="add-client-tabs"
    active-color="white"
    indicator-color="transparent"
    align="left"
    :data-testid="clientOverviewAltTestIds.tabs"
    @update:model-value="emit('update:modelValue', $event)">
    <q-tab
      v-for="tab in tabs"
      :key="tab.key"
      :name="tab.key"
      :data-testid="clientOverviewAltTestIds.tab(tab.key)"
      :class="tabClass(tab)"
      :aria-selected="tab.key === modelValue">
      <span class="label row items-center no-wrap">
        <q-icon
          :name="tab.icon"
          size="18px"
          class="icon"
        />
        <span class="text">{{ tab.label }}</span>
        <span
          v-if="tab.alert"
          class="client-overview-alt-tabs__alert-dot"
          aria-hidden="true"
        />
      </span>
    </q-tab>
  </q-tabs>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { addClientTabKeys } from 'components/constants.js'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: addClientTabKeys.appointments,
  },
  insuranceAlert: {
    type: Boolean,
    default: false,
  },
  allergiesSeverityModifier: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const tabs = computed(() => [
  {
    key: addClientTabKeys.appointments,
    label: t('tabAppointments'),
    icon: 'event',
  },
  {
    key: addClientTabKeys.encounters,
    label: t('tabEncounters'),
    icon: 'local_hospital',
  },
  {
    key: addClientTabKeys.basic,
    label: t('tabBasicInfo'),
    icon: 'person',
  },
  {
    key: addClientTabKeys.consents,
    label: t('tabConsents'),
    icon: 'draw',
  },
  {
    key: addClientTabKeys.contact,
    label: t('tabContact'),
    icon: 'contact_mail',
  },
  {
    key: addClientTabKeys.allergies,
    label: t('tabAllergies'),
    icon: 'warning_amber',
  },
  {
    key: addClientTabKeys.insurance,
    label: t('tabInsurance'),
    icon: 'health_and_safety',
    alert: props.insuranceAlert,
  },
  {
    key: addClientTabKeys.clinical,
    label: t('tabClinical'),
    icon: 'medical_services',
  },
  {
    key: addClientTabKeys.careCoordination,
    label: t('tabCareCoordination'),
    icon: 'groups',
  },
  {
    key: addClientTabKeys.financials,
    label: t('tabFinancial'),
    icon: 'payments',
  },
  {
    key: addClientTabKeys.documents,
    label: t('tabDocuments'),
    icon: 'folder',
  },
])

function tabClass(tab) {
  if (
    tab.key === addClientTabKeys.allergies
    && props.allergiesSeverityModifier
  ) {
    return `allergies-${props.allergiesSeverityModifier}`
  }
  return undefined
}
</script>
