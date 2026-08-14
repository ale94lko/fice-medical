<template>
  <div class="chrome staff-profile-tabs">
    <div class="tabs-row">
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
        @update:model-value="emit('update:modelValue', $event)">
        <q-tab
          v-for="tab in tabs"
          :key="tab.key"
          :name="tab.key"
          :aria-selected="tab.key === modelValue">
          <span class="label row items-center no-wrap">
            <q-icon
              :name="tab.icon"
              size="18px"
              class="icon"
            />
            <span class="text">{{ tab.label }}</span>
          </span>
        </q-tab>
      </q-tabs>
    </div>
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
      icon: 'contact_phone',
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
    icon: 'admin_panel_settings',
  })

  return list
})
</script>
