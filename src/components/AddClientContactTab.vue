<template>
  <div class="add-client-contact-tab">
    <div
      v-if="!canView"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('contactNoPermission') }}
      </p>
    </div>

    <fieldset
      v-else
      :disabled="readonly"
      class="add-client-form__readonly-fieldset">
    <ContactSaveBusinessRuleBanner
      :error-key="saveBusinessRuleErrorKey"
    />
    <ContactSelfPanel
      v-if="activeSubTab === CONTACT_SUB_TAB_SELF"
      ref="contactSelfPanelRef"
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
          ref="otherContactPanelRef"
          :contact="activeOtherContact"
          :client-address="contact"
          :rules="rules"
          :show-contact-method-required-banner="
            isOtherContactMissingContactMethod(activeOtherContact?.id)"
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
    </fieldset>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  countOtherContactSubTabErrors,
  countSelfContactSubTabErrors,
} from 'src/utils/add-client-form-validation.js'
import ContactSelfPanel from './ContactSelfPanel.vue'
import ContactSaveBusinessRuleBanner from './ContactSaveBusinessRuleBanner.vue'
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
  readonly: { type: Boolean, default: false },
  canView: { type: Boolean, default: true },
  saveBusinessRuleErrorKey: { type: String, default: null },
  otherContactMissingContactMethodIds: {
    type: Array,
    default: () => [],
  },
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
const contactSelfPanelRef = ref(null)
const otherContactPanelRef = ref(null)

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

function isOtherContactMissingContactMethod(contactId) {
  if (!contactId) {
    return false
  }

  return props.otherContactMissingContactMethodIds.includes(contactId)
}

function resolveFirstInvalidContactSubTab(section) {
  if (countSelfContactSubTabErrors(section, props.rules) > 0) {
    return CONTACT_SUB_TAB_SELF
  }

  for (const other of section.otherContacts ?? []) {
    if (countOtherContactSubTabErrors(other, section, props.rules) > 0) {
      return other.id
    }
  }

  return null
}

async function validateActiveSubTab() {
  await nextTick()
  if (props.activeSubTab === CONTACT_SUB_TAB_SELF) {
    await contactSelfPanelRef.value?.validateVisibleFields?.()

    return
  }

  await otherContactPanelRef.value?.validateVisibleFields?.()
}

async function applySaveValidation() {
  const section = contact.value
  const focusSubTab = resolveFirstInvalidContactSubTab(section)

  if (countSelfContactSubTabErrors(section, props.rules) > 0) {
    section.activeContactSubTab = CONTACT_SUB_TAB_SELF
    await nextTick()
    await contactSelfPanelRef.value?.validateVisibleFields?.()
  }

  for (const other of section.otherContacts ?? []) {
    if (countOtherContactSubTabErrors(other, section, props.rules) === 0) {
      continue
    }
    section.activeContactSubTab = other.id
    section.otherContactExpanded = true
    await nextTick()
    await otherContactPanelRef.value?.validateVisibleFields?.()
  }

  if (focusSubTab) {
    section.activeContactSubTab = focusSubTab
    section.otherContactExpanded = focusSubTab !== CONTACT_SUB_TAB_SELF
    await nextTick()
    await validateActiveSubTab()
  }
}

async function clearSaveValidation() {
  const section = contact.value
  const originalSubTab = props.activeSubTab

  section.activeContactSubTab = CONTACT_SUB_TAB_SELF
  await nextTick()
  contactSelfPanelRef.value?.clearVisibleFields?.()

  for (const other of section.otherContacts ?? []) {
    section.activeContactSubTab = other.id
    section.otherContactExpanded = true
    await nextTick()
    otherContactPanelRef.value?.clearVisibleFields?.()
  }

  section.activeContactSubTab = originalSubTab
  section.otherContactExpanded = originalSubTab !== CONTACT_SUB_TAB_SELF
  await nextTick()
}

defineExpose({
  CONTACT_SUB_TAB_SELF,
  requestRemoveOtherContactById,
  applySaveValidation,
  clearSaveValidation,
  validateActiveSubTab,
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
