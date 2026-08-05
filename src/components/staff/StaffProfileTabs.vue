<template>
  <div
    class="client-overview-alt-tabs staff-profile-tabs"
    role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      role="tab"
      class="client-overview-alt-tabs__tab"
      :class="{
        'client-overview-alt-tabs__tab--active': tab.key === modelValue,
      }"
      :aria-selected="tab.key === modelValue"
      @click="emit('update:modelValue', tab.key)">
      <q-icon :name="tab.icon" size="18px" />
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { staffProfileTabKeys } from 'src/utils/staff-profile-view.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: staffProfileTabKeys.basic,
  },
  showClinical: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const tabs = computed(() => {
  const list = [
    {
      key: staffProfileTabKeys.basic,
      label: t('tabStaffBasicInformation'),
      icon: 'person',
    },
    {
      key: staffProfileTabKeys.contact,
      label: t('tabStaffContactInformation'),
      icon: 'contact_mail',
    },
    {
      key: staffProfileTabKeys.employment,
      label: t('tabStaffEmployment'),
      icon: 'work',
    },
  ]
  if (props.showClinical) {
    list.push({
      key: staffProfileTabKeys.clinical,
      label: t('tabStaffClinicalProfile'),
      icon: 'medical_services',
    })
  }
  list.push({
    key: staffProfileTabKeys.systemAccess,
    label: t('tabStaffSystemAccess'),
    icon: 'manage_accounts',
  })

  return list
})
</script>
