<template>
  <div
    class="client-overview-alt-tabs"
    role="tablist"
    :data-testid="clientOverviewAltTestIds.tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      role="tab"
      class="client-overview-alt-tabs__tab"
      :class="{
        'client-overview-alt-tabs__tab--active': tab.key === modelValue,
        [`client-overview-alt-tabs__tab--allergies-${
          allergiesSeverityModifier
        }`]: Boolean(
          tab.key === addClientTabKeys.allergies
          && allergiesSeverityModifier,
        ),
      }"
      :aria-selected="tab.key === modelValue"
      :data-testid="clientOverviewAltTestIds.tab(tab.key)"
      @click="emit('update:modelValue', tab.key)">
      <q-icon :name="tab.icon" size="18px" />
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.alert"
        class="client-overview-alt-tabs__alert-dot"
        aria-hidden="true"
      />
    </button>
  </div>
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
</script>
