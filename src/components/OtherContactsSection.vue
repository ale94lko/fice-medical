<template>
  <AddClientAccordionSection
    v-model="contact.otherContactExpanded"
    icon="groups"
    :title="t('otherContact')"
    section-test-id="add-client-accordion-other-contact"
    :toggle-test-id="tid.accordionToggle('other-contact')">
    <div
      v-if="!contact.otherContacts.length"
      class="add-client-form__other-contact-empty">
      <p class="add-client-form__other-contact-empty-hint">
        {{ t('otherContactEmptyHint') }}
      </p>
      <q-btn
        outline
        no-caps
        color="primary"
        class="full-width add-client-form__other-contact-btn"
        icon="add"
        :data-testid="tid.otherContactAdd"
        :label="t('addOtherContact')"
        @click="addOtherContact"
      />
    </div>

    <div v-else class="add-client-form__other-contact-card">
      <div
        class="row items-center no-wrap
          add-client-form__other-contact-tabs-row">
        <q-tabs
          v-model="contact.activeOtherContactId"
          dense
          no-caps
          outside-arrows
          mobile-arrows
          class="add-client-tabs col"
          align="left">
          <q-tab
            v-for="(oc, index) in contact.otherContacts"
            :key="oc.id"
            :name="oc.id"
            :data-testid="tid.otherContactTab(oc.id)"
            class="add-client-form__other-contact-tab">
            <div
              class="add-client-form__other-contact-tab-label
                row items-center no-wrap">
              <span
                class="add-client-form__other-contact-tab-text ellipsis">
                {{ otherContactTabLabel(oc, index) }}
              </span>
              <button
                type="button"
                class="add-client-form__other-contact-tab-remove"
                :data-testid="tid.otherContactRemove"
                :aria-label="t('removeOtherContact')"
                @click.stop="requestRemoveOtherContact(oc, index)"
                @mousedown.stop
              >
                <q-icon name="close" size="14px" />
              </button>
            </div>
          </q-tab>
        </q-tabs>
        <q-btn
          flat
          no-caps
          color="primary"
          class="add-client-form__other-contact-add-tab q-ml-sm"
          icon="add"
          :data-testid="tid.otherContactAdd"
          :label="t('addOtherContact')"
          @click="addOtherContact"
        />
      </div>

      <q-tab-panels
        v-model="contact.activeOtherContactId"
        animated
        class="bg-transparent add-client-form__other-contact-panels">
        <q-tab-panel
          v-for="(oc, ocIndex) in contact.otherContacts"
          :key="oc.id"
          :name="oc.id"
          class="add-client-form__other-contact-panel">
          <OtherContactPanel
            :contact="oc"
            :client-address="contact"
            :rules="rules"
            :state-options="stateOptions"
            :phone-type-options="phoneTypeOptions"
            :email-type-options="emailTypeOptions"
            :contact-type-options="contactTypeOptions"
            :relationship-type-options="relationshipTypeOptions"
            :prefix-options="prefixOptions"
            :suffix-options="suffixOptions"
            :catalogs-loading="catalogsLoading"
            @update:contact="patch => updateOtherContact(ocIndex, patch)"
          />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </AddClientAccordionSection>

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
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import OtherContactPanel from 'components/OtherContactPanel.vue'
import AddClientAccordionSection from 'components/AddClientAccordionSection.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  createEmptyOtherContact,
  resolveOtherContactTabLabel,
} from 'src/utils/client-contact-form.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  rules: {
    type: Object,
    default: () => ({}),
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
  contactTypeOptions: {
    type: Array,
    default: () => [],
  },
  relationshipTypeOptions: {
    type: Array,
    default: () => [],
  },
  prefixOptions: {
    type: Array,
    default: () => [],
  },
  suffixOptions: {
    type: Array,
    default: () => [],
  },
  catalogsLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const removeConfirmOpen = ref(false)
const pendingRemoveIndex = ref(-1)
const pendingRemoveLabel = ref('')

const removeConfirmMessage = computed(() =>
  t('removeOtherContactMessage', { name: pendingRemoveLabel.value }),
)

const contact = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

function addOtherContact() {
  const oc = createEmptyOtherContact()
  contact.value.otherContacts.push(oc)
  contact.value.activeOtherContactId = oc.id
  contact.value.otherContactExpanded = true
}

function updateOtherContact(index, patch) {
  Object.assign(contact.value.otherContacts[index], patch)
}

function otherContactTabLabel(oc, index) {
  return resolveOtherContactTabLabel(oc, index, t)
}

function requestRemoveOtherContact(oc, index) {
  pendingRemoveIndex.value = index
  pendingRemoveLabel.value = otherContactTabLabel(oc, index)
  removeConfirmOpen.value = true
}

function confirmRemoveOtherContact() {
  const index = pendingRemoveIndex.value
  if (index < 0) {
    return
  }
  const removedId = contact.value.otherContacts[index]?.id
  contact.value.otherContacts.splice(index, 1)
  if (removedId && contact.value.activeOtherContactId === removedId) {
    const nextIndex = Math.min(
      index,
      contact.value.otherContacts.length - 1,
    )
    const next = contact.value.otherContacts[nextIndex]
    contact.value.activeOtherContactId = next?.id ?? null
  }
  dismissRemoveConfirm()
}

function dismissRemoveConfirm() {
  pendingRemoveIndex.value = -1
  pendingRemoveLabel.value = ''
  removeConfirmOpen.value = false
}
</script>
