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

    <q-dialog
      v-model="guardianConsentOpen"
      persistent
      transition-show="scale"
      transition-hide="scale"
      data-testid="guardian-signed-consent-dialog">
      <q-card class="insurance-dialog app-dialog-card">
        <AppDialogHeader
          :close-label="t('close')"
          @close="dismissGuardianConsentAction">
          {{ guardianConsentTitle }}
        </AppDialogHeader>
        <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
          <p class="text-body2 text-grey-7 q-mb-md">
            {{ guardianConsentMessage }}
          </p>
          <p class="text-body2 text-weight-medium q-mb-sm">
            {{ t('guardianSignedConsentListTitle') }}
          </p>
          <div class="guardian-signed-consent-list">
            <div
              v-for="item in guardianConsentItems"
              :key="item.id"
              class="guardian-signed-consent-list__row
                row items-center no-wrap q-col-gutter-sm">
              <div class="col">
                <div class="text-body2 text-weight-medium">
                  {{ item.consentName || t('clientConsentViewTitle') }}
                </div>
                <div
                  v-if="item.signedByName || item.version"
                  class="text-caption text-grey-7">
                  <template v-if="item.signedByName">
                    {{ item.signedByName }}
                  </template>
                  <template v-if="item.signedByName && item.version">
                    ·
                  </template>
                  <template v-if="item.version">
                    v{{ item.version }}
                  </template>
                </div>
              </div>
              <div class="col-auto">
                <q-btn
                  no-caps
                  outline
                  dense
                  color="primary"
                  class="app-btn-outline"
                  :disable="guardianConsentBusy || viewingConsentId != null"
                  :loading="viewingConsentId === item.id"
                  :label="t('guardianSignedConsentView')"
                  @click="onViewGuardianConsent(item)"
                />
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions
          align="right"
          class="app-dialog-card__actions">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('cancel')"
            :disable="guardianConsentBusy"
            @click="dismissGuardianConsentAction"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :label="guardianConsentConfirmText"
            :loading="guardianConsentBusy"
            :disable="guardianConsentBusy"
            @click="confirmGuardianConsentAction"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ClientConsentViewDialog
      v-model="viewConsentOpen"
      :consent="viewConsent"
    />
    </fieldset>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  countOtherContactSubTabErrors,
  countSelfContactSubTabErrors,
} from 'src/utils/add-client-form-validation.js'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ClientConsentViewDialog from
  'components/ClientConsentViewDialog.vue'
import ContactSelfPanel from './ContactSelfPanel.vue'
import ContactSaveBusinessRuleBanner from './ContactSaveBusinessRuleBanner.vue'
import OtherContactPanel from './OtherContactPanel.vue'
import AccordionSection from './AccordionSection.vue'
import ModalComponent from './ModalComponent.vue'
import {
  clientEmailTypeValues,
  clientPhoneTypeValues,
  clientSuffixOptions,
  quasarNotifyTypes,
} from './constants.js'
import { usStates } from 'src/data/us-geography.js'
import {
  resolveOtherContactTabLabel,
  syncOtherContactsWithClientAddress,
} from 'src/utils/client-contact-form.js'
import {
  isGuardianOtherContact,
  listAcceptedGuardianConsents,
  revokeAcceptedGuardianConsents,
  wouldLoseGuardianContactType,
} from 'src/utils/consent-guardian-contact-guard.js'
import {
  consentApiErrorMessage,
  fetchClientConsent,
} from 'src/utils/consent-api.js'
import { useConsentPermissions } from
  'src/composables/useConsentPermissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { hasClientChartKey } from 'components/helpers.js'
import {
  addClientTestIds as tid,
} from 'src/test-ids/index.js'

import {
  CONTACT_SUB_TAB_SELF,
} from 'src/composables/useContactSubTabs.js'

const props = defineProps({
  modelValue: { type: Object, required: true },
  activeSubTab: { type: String, default: CONTACT_SUB_TAB_SELF },
  clientId: { type: [String, Number], default: null },
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
const $q = useQuasar()
const { canRevoke, canView: canViewConsents } = useConsentPermissions()

const removeConfirmOpen = ref(false)
const pendingRemoveIndex = ref(-1)
const pendingRemoveLabel = ref('')
const guardianConsentOpen = ref(false)
const guardianConsentBusy = ref(false)
const pendingGuardianAction = ref(null)
const viewConsentOpen = ref(false)
const viewConsent = ref(null)
const viewingConsentId = ref(null)
const contactSelfPanelRef = ref(null)
const otherContactPanelRef = ref(null)

const contact = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const hasClientId = computed(() =>
  hasClientChartKey(props.clientId),
)

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

watch(
  () => [
    contact.value?.addressLine1,
    contact.value?.addressLine2,
    contact.value?.city,
    contact.value?.state,
    contact.value?.county,
    contact.value?.zipCode,
    contact.value?.country,
  ],
  () => {
    syncOtherContactsWithClientAddress(contact.value)
  },
)

watch(
  () => props.activeSubTab,
  tab => {
    if (tab === CONTACT_SUB_TAB_SELF) {
      return
    }
    syncOtherContactsWithClientAddress(contact.value)
  },
)

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

const guardianConsentTitle = computed(() => {
  if (pendingGuardianAction.value?.type === 'demote') {
    return t('guardianSignedConsentDemoteTitle')
  }

  return t('guardianSignedConsentRemoveTitle')
})

const guardianConsentMessage = computed(() => {
  const count = pendingGuardianAction.value?.consentCount ?? 0
  if (pendingGuardianAction.value?.type === 'demote') {
    return t('guardianSignedConsentDemoteMessage', { count })
  }

  return t('guardianSignedConsentRemoveMessage', {
    name: pendingGuardianAction.value?.label || '',
    count,
  })
})

const guardianConsentConfirmText = computed(() => {
  if (pendingGuardianAction.value?.type === 'demote') {
    return t('guardianSignedConsentDemoteConfirm')
  }

  return t('guardianSignedConsentRemoveConfirm')
})

const guardianConsentItems = computed(
  () => pendingGuardianAction.value?.consents ?? [],
)

function applyOtherContactPatch(index, patch) {
  const rows = contact.value.otherContacts ?? []
  const current = rows[index]
  if (!current) {
    return
  }
  Object.assign(current, patch)
}

function notifyConsentError(error, fallbackKey) {
  if (isAuthSessionEndUIError(error)) {
    return
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: consentApiErrorMessage(error, t(fallbackKey)),
  })
}

async function loadAcceptedGuardianConsents() {
  if (!hasClientId.value) {
    return []
  }

  return listAcceptedGuardianConsents(props.clientId)
}

async function openGuardianConsentGuard(action) {
  if (!canRevoke.value) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('guardianSignedConsentNoRevokePermission'),
    })

    return false
  }
  pendingGuardianAction.value = action
  guardianConsentOpen.value = true

  return true
}

async function onViewGuardianConsent(item) {
  if (!item?.id || !hasClientId.value) {
    return
  }
  if (!canViewConsents.value) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('clientConsentsNoPermission'),
    })

    return
  }
  viewingConsentId.value = item.id
  try {
    viewConsent.value = await fetchClientConsent(props.clientId, item.id)
    viewConsentOpen.value = true
  } catch (error) {
    notifyConsentError(error, 'clientConsentLoadError')
  } finally {
    viewingConsentId.value = null
  }
}

async function updateOtherContact(index, patch) {
  const rows = contact.value.otherContacts ?? []
  const current = rows[index]
  if (!current || !patch || typeof patch !== 'object') {
    return
  }
  if (wouldLoseGuardianContactType(
    current.contactType,
    patch.contactType,
  )) {
    try {
      const consents = await loadAcceptedGuardianConsents()
      if (consents.length > 0) {
        await openGuardianConsentGuard({
          type: 'demote',
          index,
          patch: { ...patch },
          consentCount: consents.length,
          consents,
          label: resolveOtherContactTabLabel(
            current,
            index,
            t,
            {
              contactTypeOptions: contactTypeOptions.value,
              relationshipTypeOptions: relationshipTypeOptions.value,
            },
            rows,
          ),
        })

        return
      }
    } catch (error) {
      notifyConsentError(error, 'guardianSignedConsentCheckError')

      return
    }
  }
  applyOtherContactPatch(index, patch)
}

function onSetResponsibleForPayments(payload) {
  emit('responsible-for-payments-change', payload)
}

function onSetPreferredPointOfContact(payload) {
  emit('preferred-point-of-contact-change', payload)
}

async function requestRemoveOtherContactById(contactId) {
  const index = (contact.value.otherContacts ?? []).findIndex(
    row => row.id === contactId,
  )
  if (index < 0) {
    return
  }
  const oc = contact.value.otherContacts[index]
  const label = resolveOtherContactTabLabel(
    oc,
    index,
    t,
    {
      contactTypeOptions: contactTypeOptions.value,
      relationshipTypeOptions: relationshipTypeOptions.value,
    },
    contact.value.otherContacts,
  )
  if (isGuardianOtherContact(oc) && hasClientId.value) {
    try {
      const consents = await loadAcceptedGuardianConsents()
      if (consents.length > 0) {
        await openGuardianConsentGuard({
          type: 'remove',
          index,
          consentCount: consents.length,
          consents,
          label,
        })

        return
      }
    } catch (error) {
      notifyConsentError(error, 'guardianSignedConsentCheckError')

      return
    }
  }
  pendingRemoveIndex.value = index
  pendingRemoveLabel.value = label
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

function dismissGuardianConsentAction() {
  pendingGuardianAction.value = null
  guardianConsentOpen.value = false
  guardianConsentBusy.value = false
  viewConsentOpen.value = false
  viewConsent.value = null
  viewingConsentId.value = null
}

async function confirmGuardianConsentAction() {
  const action = pendingGuardianAction.value
  if (!action || guardianConsentBusy.value) {
    return
  }
  guardianConsentBusy.value = true
  try {
    await revokeAcceptedGuardianConsents(
      props.clientId,
      t('guardianSignedConsentRevocationReason'),
    )
    if (action.type === 'remove') {
      emit('remove-other-contact', action.index)
    } else if (action.type === 'demote' && action.patch) {
      applyOtherContactPatch(action.index, action.patch)
    }
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('guardianSignedConsentRevokeSuccess', {
        count: action.consentCount,
      }),
    })
    dismissGuardianConsentAction()
  } catch (error) {
    notifyConsentError(error, 'guardianSignedConsentRevokeError')
    guardianConsentBusy.value = false
  }
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
    if (countSelfContactSubTabErrors(contact.value, props.rules) > 0) {
      await contactSelfPanelRef.value?.validateVisibleFields?.()
    } else {
      contactSelfPanelRef.value?.clearVisibleFields?.()
    }

    return
  }

  const other = activeOtherContact.value
  if (!other) {
    return
  }

  if (countOtherContactSubTabErrors(other, contact.value, props.rules) > 0) {
    await otherContactPanelRef.value?.validateVisibleFields?.()
  } else {
    otherContactPanelRef.value?.clearVisibleFields?.()
  }
}

async function applySaveValidation() {
  const section = contact.value
  const focusSubTab = resolveFirstInvalidContactSubTab(section)

  if (countSelfContactSubTabErrors(section, props.rules) > 0) {
    section.activeContactSubTab = CONTACT_SUB_TAB_SELF
    await nextTick()
    await contactSelfPanelRef.value?.validateVisibleFields?.()
  } else {
    section.activeContactSubTab = CONTACT_SUB_TAB_SELF
    await nextTick()
    contactSelfPanelRef.value?.clearVisibleFields?.()
  }

  for (const other of section.otherContacts ?? []) {
    section.activeContactSubTab = other.id
    section.otherContactExpanded = true
    await nextTick()
    if (countOtherContactSubTabErrors(other, section, props.rules) > 0) {
      await otherContactPanelRef.value?.validateVisibleFields?.()
    } else {
      otherContactPanelRef.value?.clearVisibleFields?.()
    }
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
@import 'src/css/quasar.variables';

.add-client-contact-tab {
  width: 100%;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}

.guardian-signed-consent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guardian-signed-consent-list__row {
  padding: 10px 12px;
  border: 1px solid $border-subtle;
  border-radius: 8px;
  background: $surface;
}
</style>
