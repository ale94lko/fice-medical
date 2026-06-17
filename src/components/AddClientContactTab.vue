<template>
  <div class="add-client-contact-tab">
    <ContactSelfPanel
      v-if="activeSubTab === CONTACT_SUB_TAB_SELF"
      v-model="contact"
      :rules="rules"
    />

    <AccordionSection
      v-else-if="activeOtherContact"
      v-model="contact.otherContactExpanded"
      icon="groups"
      :title="t('otherContact')"
      section-test-id="add-client-accordion-other-contact"
      :toggle-test-id="tid.accordionToggle('other-contact')">
      <div class="other-contact-panel">
        <OtherContactPanel
          :contact="activeOtherContact"
          :client-address="contact"
          :rules="rules"
          :state-options="stateOptions"
          :phone-type-options="phoneTypeOptions"
          :email-type-options="emailTypeOptions"
          :contact-type-options="contactTypeOptions"
          :relationship-type-options="relationshipTypeOptions"
          :prefix-options="prefixSelectOptions"
          :suffix-options="suffixSelectOptions"
          :catalogs-loading="catalogsLoading"
          :show-delete="false"
          @update:contact="patch => updateOtherContact(activeOtherIndex, patch)"
          @set-responsible-for-payments="onSetResponsibleForPayments"
          @set-preferred-point-of-contact="onSetPreferredPointOfContact"
        />
      </div>
    </AccordionSection>

    <ModalComponent
      v-model="removeConfirmOpen"
      test-id="remove-other-contact"
      :title="t('removeOtherContactTitle')"
      :message="removeConfirmMessage"
      :confirm-text="t('removeOtherContactConfirm')"
      :cancel-text="t('cancel')"
      @confirm="confirmRemoveOtherContact"
      @cancel="dismissRemoveConfirm"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ContactSelfPanel from './ContactSelfPanel.vue'
import OtherContactPanel from './OtherContactPanel.vue'
import AccordionSection from './AccordionSection.vue'
import ModalComponent from './ModalComponent.vue'
import {
  clientEmailTypeValues,
  clientPhoneTypeValues,
  clientSuffixOptions,
} from './constants.js'
import { usStates } from 'src/data/us-geography.js'
import {
  resolveOtherContactTabLabel,
} from 'src/utils/client-contact-form.js'
import {
  addClientTestIds as tid,
} from 'src/test-ids/index.js'

import {
  CONTACT_SUB_TAB_SELF,
} from 'src/composables/useContactSubTabs.js'

const props = defineProps({
  modelValue: { type: Object, required: true },
  activeSubTab: { type: String, default: CONTACT_SUB_TAB_SELF },
  rules: { type: Object, default: () => ({}) },
  prefixSelectOptions: { type: Array, default: () => [] },
  suffixSelectOptions: { type: Array, default: () => [] },
  contactTypeOptions: { type: Array, default: () => [] },
  relationshipTypeOptions: { type: Array, default: () => [] },
  catalogsLoading: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'remove-other-contact',
  'preferred-point-of-contact-change',
  'responsible-for-payments-change',
])

const { t } = useI18n()

const removeConfirmOpen = ref(false)
const pendingRemoveIndex = ref(-1)
const pendingRemoveLabel = ref('')

const contact = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const activeOtherIndex = computed(() =>
  (contact.value.otherContacts ?? []).findIndex(
    row => row.id === props.activeSubTab,
  ),
)

const activeOtherContact = computed(() => {
  const index = activeOtherIndex.value
  if (index < 0) {
    return null
  }

  return contact.value.otherContacts[index]
})

const stateOptions = usStates

const phoneTypeOptions = computed(() =>
  Object.values(clientPhoneTypeValues).map(v => ({ label: v, value: v })),
)

const emailTypeOptions = computed(() =>
  Object.values(clientEmailTypeValues).map(v => ({ label: v, value: v })),
)

const contactTypeOptions = computed(
  () => props.contactTypeOptions ?? [],
)

const relationshipTypeOptions = computed(
  () => props.relationshipTypeOptions ?? [],
)

const prefixSelectOptions = computed(
  () => props.prefixSelectOptions ?? [],
)

const suffixSelectOptions = computed(() => {
  if (props.suffixSelectOptions?.length) {
    return props.suffixSelectOptions
  }

  return clientSuffixOptions
    .filter(o => o.value)
    .map(o => ({
      label: t(o.labelKey),
      value: o.value,
    }))
})

const removeConfirmMessage = computed(() =>
  t('removeOtherContactMessage', { name: pendingRemoveLabel.value }),
)

function updateOtherContact(index, patch) {
  const rows = contact.value.otherContacts ?? []
  const current = rows[index]
  if (!current) {
    return
  }
  Object.assign(current, patch)
}

function onSetResponsibleForPayments(payload) {
  emit('responsible-for-payments-change', payload)
}

function onSetPreferredPointOfContact(payload) {
  emit('preferred-point-of-contact-change', payload)
}

function requestRemoveOtherContactById(contactId) {
  const index = (contact.value.otherContacts ?? []).findIndex(
    row => row.id === contactId,
  )
  if (index < 0) {
    return
  }
  const oc = contact.value.otherContacts[index]
  pendingRemoveIndex.value = index
  pendingRemoveLabel.value = resolveOtherContactTabLabel(
    oc,
    index,
    t,
    {
      contactTypeOptions: contactTypeOptions.value,
      relationshipTypeOptions: relationshipTypeOptions.value,
    },
    contact.value.otherContacts,
  )
  removeConfirmOpen.value = true
}

function confirmRemoveOtherContact() {
  const index = pendingRemoveIndex.value
  if (index >= 0) {
    emit('remove-other-contact', index)
  }
  dismissRemoveConfirm()
}

function dismissRemoveConfirm() {
  pendingRemoveIndex.value = -1
  pendingRemoveLabel.value = ''
  removeConfirmOpen.value = false
}

defineExpose({
  CONTACT_SUB_TAB_SELF,
  requestRemoveOtherContactById,
})
</script>

<style lang="scss" scoped>
.add-client-contact-tab {
  width: 100%;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}
</style>
