import { computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import {
  canAddAnotherOtherContact,
  createEmptyOtherContact,
  resolveOtherContactTabLabel,
  setOtherContactResponsibleForPayments,
} from 'src/utils/client-contact-form.js'
import {
  applyDefaultPreferredPointOfContact,
  clearPreferredPointOfContactIfRemoved,
  isPointOfContactPreferred,
  setOtherContactPreferredPointOfContact,
  syncPointOfContactSelection,
} from 'src/utils/client-preferred-communication.js'
import { quasarNotifyTypes } from 'components/constants.js'

export const CONTACT_SUB_TAB_SELF = 'self'
export const CONTACT_SUB_TAB_ADD = 'add'

export function useContactSubTabs(getContactSection, catalogOptionsRef) {
  const { t } = useI18n()
  const $q = useQuasar()

  const isContactSubTabActive = computed(() => Boolean(getContactSection()))

  const activeContactSubTab = computed({
    get() {
      const contact = getContactSection()
      if (!contact) {
        return CONTACT_SUB_TAB_SELF
      }
      const stored = contact.activeContactSubTab
      if (stored === CONTACT_SUB_TAB_SELF) {
        return CONTACT_SUB_TAB_SELF
      }
      if (stored === CONTACT_SUB_TAB_ADD) {
        return CONTACT_SUB_TAB_ADD
      }
      if (stored && (contact.otherContacts ?? [])
        .some(item => item.id === stored)) {
        return stored
      }

      return CONTACT_SUB_TAB_SELF
    },
    set(value) {
      const contact = getContactSection()
      if (!contact) {
        return
      }
      contact.activeContactSubTab = value
    },
  })

  const contactOtherLabelDeps = computed(() => {
    const contact = getContactSection()
    const rows = contact?.otherContacts ?? []

    return rows.map(other => [
      other.id,
      other.relationshipType,
      other.contactType,
    ].join(':')).join('|')
  })

  const contactOtherMinimumDeps = computed(() => {
    const contact = getContactSection()
    const rows = contact?.otherContacts ?? []

    return rows.map(other => {
      const phones = (other.phones ?? [])
        .map(phone => String(phone?.number ?? '').trim())
        .join(',')
      const emails = (other.emails ?? [])
        .map(email => String(email?.address ?? '').trim())
        .join(',')

      return [
        other.firstName,
        other.lastName,
        other.addressLine1,
        other.addressLine2,
        other.city,
        other.state,
        other.zipCode,
        other.sameAsClientAddress,
        phones,
        emails,
      ].join('|')
    }).join('||')
  })

  const canAddOtherContact = computed(() => {
    void contactOtherMinimumDeps.value

    return canAddAnotherOtherContact(getContactSection())
  })

  const contactSubTabs = computed(() => {
    void contactOtherLabelDeps.value
    void contactOtherMinimumDeps.value
    const contact = getContactSection()
    const catalogOptions = catalogOptionsRef?.value ?? {}
    const tabs = [
      {
        key: CONTACT_SUB_TAB_SELF,
        icon: 'person',
        label: t('contactSubTabSelf'),
      },
    ]
    for (const [index, other] of (contact?.otherContacts ?? []).entries()) {
      tabs.push({
        key: other.id,
        icon: 'contacts',
        removable: true,
        label: resolveOtherContactTabLabel(
          other,
          index,
          t,
          catalogOptions,
          contact?.otherContacts ?? [],
        ),
      })
    }
    tabs.push({
      key: CONTACT_SUB_TAB_ADD,
      icon: 'add',
      label: t('contactSubTabAdd'),
      disabled: !canAddOtherContact.value,
    })

    return tabs
  })

  function notifyAddContactMinimumRequired() {
    $q.notify({
      type: 'warning',
      message: t('contactAddMinimumRequired'),
      position: 'top',
    })
  }

  function addOtherContact() {
    const contact = getContactSection()
    if (!contact) {
      return null
    }
    if (!canAddAnotherOtherContact(contact)) {
      notifyAddContactMinimumRequired()

      return null
    }
    const oc = createEmptyOtherContact()
    if (!contact.otherContacts) {
      contact.otherContacts = []
    }
    contact.otherContacts.push(oc)
    if (isPointOfContactPreferred(contact.preferredCommunication)) {
      applyDefaultPreferredPointOfContact(contact, oc.id)
    }
    syncPointOfContactSelection(contact)
    contact.otherContactExpanded = true
    activeContactSubTab.value = oc.id

    return oc
  }

  function removeOtherContact(index) {
    const contact = getContactSection()
    if (!contact) {
      return
    }
    const removedId = contact.otherContacts[index]?.id
    contact.otherContacts.splice(index, 1)
    clearPreferredPointOfContactIfRemoved(contact, removedId)
    syncPointOfContactSelection(contact)
    if (activeContactSubTab.value === removedId) {
      activeContactSubTab.value = CONTACT_SUB_TAB_SELF
    }
  }

  function onResponsibleForPaymentsChange({ contactId, value, label }) {
    const contact = getContactSection()
    if (!contact) {
      return
    }
    const previousId = (contact.otherContacts ?? []).find(
      other => other.responsibleForPayments,
    )?.id ?? null
    setOtherContactResponsibleForPayments(contact, contactId, value)
    if (value && previousId && previousId !== contactId) {
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('responsibleForPaymentsChanged', { name: label }),
        position: 'top',
      })
    }
  }

  function onPreferredPointOfContactChange({ contactId, value, label }) {
    const contact = getContactSection()
    if (!contact) {
      return
    }
    const previousId = contact.preferredPointOfContactId
    setOtherContactPreferredPointOfContact(contact, contactId, value)
    if (value && previousId && previousId !== contactId) {
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('preferredPointOfContactChanged', { name: label }),
        position: 'top',
      })
    }
  }

  watch(activeContactSubTab, (tab, prev) => {
    if (tab === CONTACT_SUB_TAB_ADD) {
      if (!canAddOtherContact.value) {
        activeContactSubTab.value = prev ?? CONTACT_SUB_TAB_SELF
        notifyAddContactMinimumRequired()

        return
      }
      addOtherContact()

      return
    }
    const contact = getContactSection()
    if (contact && tab !== CONTACT_SUB_TAB_SELF) {
      contact.otherContactExpanded = true
    }
  })

  return {
    isContactSubTabActive,
    activeContactSubTab,
    contactSubTabs,
    canAddOtherContact,
    addOtherContact,
    removeOtherContact,
    onResponsibleForPaymentsChange,
    onPreferredPointOfContactChange,
    CONTACT_SUB_TAB_SELF,
    CONTACT_SUB_TAB_ADD,
  }
}
