<template>
  <div class="add-client-contact-tab">
    <AccordionSection
      icon="place"
      :title="t('clientAddress')"
      section-test-id="add-client-accordion-client-address"
      :toggle-test-id="tid.accordionToggle('client-address')">
      <div class="row q-col-gutter-sm q-col-gutter-md">
          <div class="col-12 col-md-6">
            <FormInput
              v-model="contact.addressLine1"
              :external-label="true"
              :label="t('addressLine1')"
              :rules="rules.addressLine1"
              maxlength="100"
              :test-id="contactFieldTestId('addressLine1')"
            />
          </div>
          <div class="col-12 col-md-6">
            <FormInput
              v-model="contact.addressLine2"
              :external-label="true"
              :label="t('addressLine2Optional')"
              :rules="rules.addressLine2"
              maxlength="100"
              :test-id="contactFieldTestId('addressLine2')"
            />
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('state')"
              :test-id="contactFieldTestId('state')">
              <FormSelect
                v-model="contact.state"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                class="full-width"
                :options="stateOptions"
                :test-id="contactFieldTestId('state')"
                @update:model-value="onClientStateChange"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('city')"
              :test-id="contactFieldTestId('city')">
              <FormSelect
                v-model="contact.city"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                class="full-width"
                :disable="!contact.state"
                :options="cityOptions"
                :test-id="contactFieldTestId('city')"
                @update:model-value="onClientCityChange"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('county')"
              :test-id="contactFieldTestId('county')">
              <FormSelect
                v-model="contact.county"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                class="full-width"
                :disable="!contact.state || !contact.city"
                :options="countyOptions"
                :test-id="contactFieldTestId('county')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <FormInput
              v-model="contact.zipCode"
              :external-label="true"
              :label="t('zipCode')"
              :rules="rules.zipCode"
              maxlength="11"
              :test-id="contactFieldTestId('zipCode')"
            />
          </div>
        </div>
    </AccordionSection>

    <q-separator class="section-separator" />

    <AccordionSection
      icon="phone"
      :title="t('contactMethods')"
      section-test-id="add-client-accordion-contact-methods"
      :toggle-test-id="tid.accordionToggle('contact-methods')">
      <div class="contact-methods-block">
          <SubsectionHeading icon="phone" :title="t('phone')" />
          <div
            v-for="(phone, index) in contact.phones"
            :key="`phone-${index}`"
            class="row q-col-gutter-sm q-col-gutter-md
              contact-method-row">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('phoneNumber')"
                :test-id="contactFieldTestId(`phone-${index}-number`)">
                <q-input
                  outlined
                  hide-bottom-space
                  lazy-rules="ondemand"
                  class="full-width"
                  :data-testid="contactFieldTestId(`phone-${index}-number`)"
                  :model-value="phone.number"
                  :placeholder="t('phoneNumberPlaceholder')"
                  :rules="phoneNumberRules(index)"
                  maxlength="14"
                  @update:model-value="val => onPhoneInput(index, val)"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('phoneType')"
                :test-id="contactFieldTestId(`phone-${index}-type`)">
                <div
                  class="row q-col-gutter-sm items-center
                    contact-method-type-row">
                  <div class="col">
                    <FormSelect
                      v-model="phone.type"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :options="phoneTypeOptions"
                      :test-id="contactFieldTestId(`phone-${index}-type`)"
                    />
                  </div>
                  <AddClientMethodRowActions
                    :is-last="index === contact.phones.length - 1"
                    :total="contact.phones.length"
                    :add-label="t('addPhone')"
                    :remove-label="t('removePhone')"
                    :add-test-id="tid.phoneAdd(index)"
                    :remove-test-id="tid.phoneRemove(index)"
                    @add="addPhone"
                    @remove="removePhone(index)"
                  />
                </div>
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="contact-methods-block">
          <SubsectionHeading
            icon="mail"
            :title="t('contactEmailLabel')"
          />
          <div
            v-for="(email, index) in contact.emails"
            :key="`email-${index}`"
            class="row q-col-gutter-sm q-col-gutter-md
              contact-method-row">
            <div class="col-12 col-md-6">
              <FormInput
                v-model="email.address"
                :external-label="true"
                :label="t('emailAddress')"
                :placeholder="t('emailAddressPlaceholder')"
                :rules="emailAddressRules(index)"
                maxlength="32"
                :test-id="contactFieldTestId(`email-${index}-address`)"
              />
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('emailType')"
                :test-id="contactFieldTestId(`email-${index}-type`)">
                <div
                  class="row q-col-gutter-sm items-center
                    contact-method-type-row">
                  <div class="col">
                    <FormSelect
                      v-model="email.type"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      clearable
                      class="full-width"
                      :options="emailTypeOptions"
                      :test-id="contactFieldTestId(`email-${index}-type`)"
                    />
                  </div>
                  <AddClientMethodRowActions
                    :is-last="index === contact.emails.length - 1"
                    :total="contact.emails.length"
                    :add-label="t('addEmail')"
                    :remove-label="t('removeEmail')"
                    :add-test-id="tid.emailAdd(index)"
                    :remove-test-id="tid.emailRemove(index)"
                    @add="addEmail"
                    @remove="removeEmail(index)"
                  />
                </div>
              </AddClientLabeledField>
            </div>
          </div>
        </div>
    </AccordionSection>

    <q-separator class="section-separator" />

    <AccordionSection
      icon="chat"
      :title="t('preferredCommunication')"
      section-test-id="add-client-accordion-preferred-communication"
      :toggle-test-id="tid.accordionToggle('preferred-communication')">
      <template #hint>
        {{ t('preferredCommunicationHint') }}
      </template>
      <div class="preferred-grid">
          <q-btn
            v-for="opt in communicationOptions"
            :key="opt.value"
            no-caps
            :data-testid="tid.preferredComm(opt.value)"
            :color="isPreferredComm(opt.value) ? 'primary' : undefined"
            :unelevated="isPreferredComm(opt.value)"
            :outline="!isPreferredComm(opt.value)"
            :class="[
              'preferred-chip',
              {
                'preferred-chip--selected':
                  isPreferredComm(opt.value),
              },
            ]"
            @click="onPreferredCommToggle(opt.value)">
            <q-icon
              :name="opt.icon"
              class="preferred-chip-icon"
            />
            <span class="preferred-chip-label">
              {{ opt.label }}
            </span>
          </q-btn>
        </div>

        <div
          v-if="showPointOfContactNoContactsError"
          class="point-of-contact-error
            form-field__error q-mt-sm">
          {{ t('prefCommNoContactsAvailable') }}
        </div>

        <div
          v-if="showCommunicationAuthorization"
          class="comm-authorization q-mt-md"
          :class="{
            'comm-authorization--active':
              hasCommunicationConsent,
          }">
          <FormToggle
            :model-value="hasCommunicationConsent"
            :label="communicationAuthorizationLabel"
            :test-id="tid.preferredCommAuth"
            @update:model-value="onCommunicationAuthorizationChange"
          />
          <span
            v-if="contact.consent"
            class="comm-authorization-date">
            {{ t('communicationAuthorizedOn', {
              date: contact.consent,
            }) }}
          </span>
        </div>

        <AddClientLabeledField
          v-if="showPreferredPointOfContactSelect"
          class="q-mt-md"
          :label="t('preferredPointOfContact')"
          :test-id="tid.preferredPointOfContact">
          <FormSelect
            v-model="contact.preferredPointOfContactId"
            outlined
            hide-bottom-space
            emit-value
            map-options
            class="full-width"
            :options="pointOfContactOptions"
            :test-id="tid.preferredPointOfContact"
          />
        </AddClientLabeledField>
    </AccordionSection>

    <q-separator class="section-separator" />

    <OtherContactsSection
      v-model="contact"
      :rules="rules"
      :state-options="stateOptions"
      :phone-type-options="phoneTypeOptions"
      :email-type-options="emailTypeOptions"
      :contact-type-options="contactTypeOptions"
      :relationship-type-options="relationshipTypeOptions"
      :prefix-options="prefixSelectOptions"
      :suffix-options="suffixSelectOptions"
      :catalogs-loading="catalogsLoading"
    />

    <q-separator class="section-separator" />

    <AccordionSection
      icon="description"
      :title="t('additionalNotes')"
      section-test-id="add-client-accordion-additional-notes"
      :toggle-test-id="tid.accordionToggle('additional-notes')">
      <div class="row q-col-gutter-sm q-col-gutter-md">
        <div class="col-12">
          <AddClientLabeledField
            :label="t('additionalNotes')"
            :test-id="contactFieldTestId('additionalNotes')">
            <q-input
              v-model="contact.additionalNotes"
              outlined
              type="textarea"
              rows="4"
              class="full-width notes-field"
              :data-testid="contactFieldTestId('additionalNotes')"
              :placeholder="t('additionalNotesPlaceholder')"
              :rules="rules.additionalNotes"
              maxlength="500"
              counter
            />
          </AddClientLabeledField>
        </div>
      </div>
    </AccordionSection>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FormInput from './FormInput.vue'
import FormToggle from './FormToggle.vue'
import AddClientLabeledField from './AddClientLabeledField.vue'
import FormSelect from './FormSelect.vue'
import OtherContactsSection from './OtherContactsSection.vue'
import AccordionSection from './AccordionSection.vue'
import SubsectionHeading from './SubsectionHeading.vue'
import AddClientMethodRowActions from './AddClientMethodRowActions.vue'
import {
  clientEmailTypeValues,
  clientPhoneTypeValues,
  clientPreferredCommunicationValues,
  clientSuffixOptions,
} from './constants.js'
import {
  usStates,
  getCitiesForState,
  getCountiesForStateCity,
} from 'src/data/us-geography.js'
import {
  createEmptyEmail,
  createEmptyPhone,
  formatPhoneUs,
} from 'src/utils/client-contact-form.js'
import {
  isPointOfContactPreferred,
  isPreferredCommunicationSelected,
  syncPreferredPointOfContactFlags,
  togglePreferredCommunication,
  resolvePointOfContactSelectLabel,
  hasConsent,
  setCommunicationAuthorization,
  shouldShowCommunicationAuthorization,
} from 'src/utils/client-preferred-communication.js'
import { useContactMethodDuplicateRules }
  from 'src/composables/useContactMethodDuplicateRules.js'
import {
  addClientTestIds as tid,
  contactFieldTestId,
} from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  rules: {
    type: Object,
    default: () => ({}),
  },
  prefixSelectOptions: {
    type: Array,
    default: () => [],
  },
  suffixSelectOptions: {
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
  catalogsLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const contact = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const { t } = useI18n()
const {
  phoneNumberRules: buildPhoneNumberRules,
  emailAddressRules: buildEmailAddressRules,
} = useContactMethodDuplicateRules(t)

function phoneNumberRules(index) {
  return buildPhoneNumberRules(
    contact.value.phones,
    index,
    props.rules?.phoneNumber ?? [],
  )
}

function emailAddressRules(index) {
  return buildEmailAddressRules(
    contact.value.emails,
    index,
    props.rules?.emailAddress ?? [],
  )
}

const stateOptions = usStates

const cityOptions = computed(() => getCitiesForState(contact.value.state))

const countyOptions = computed(() =>
  getCountiesForStateCity(contact.value.state, contact.value.city),
)

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

const communicationOptions = computed(() => [
  {
    value: clientPreferredCommunicationValues.providerDidNotAsk,
    icon: 'help_outline',
    label: t('prefCommProviderDidNotAsk'),
  },
  {
    value: clientPreferredCommunicationValues.patientDeclined,
    icon: 'person_off',
    label: t('prefCommPatientDeclined'),
  },
  {
    value: clientPreferredCommunicationValues.workPhone,
    icon: 'work',
    label: t('prefCommWorkPhone'),
  },
  {
    value: clientPreferredCommunicationValues.homePhone,
    icon: 'home',
    label: t('prefCommHomePhone'),
  },
  {
    value: clientPreferredCommunicationValues.mobilePhone,
    icon: 'smartphone',
    label: t('prefCommMobilePhone'),
  },
  {
    value: clientPreferredCommunicationValues.mail,
    icon: 'mail',
    label: t('prefCommMail'),
  },
  {
    value: clientPreferredCommunicationValues.email,
    icon: 'alternate_email',
    label: t('prefCommEmail'),
  },
  {
    value: clientPreferredCommunicationValues.pointOfContact,
    icon: 'people_outline',
    label: t('prefCommPointOfContact'),
  },
])

const showCommunicationAuthorization = computed(() =>
  shouldShowCommunicationAuthorization(contact.value.preferredCommunication),
)

const showPointOfContactSelected = computed(() =>
  isPointOfContactPreferred(contact.value.preferredCommunication),
)

const hasOtherContacts = computed(
  () => (contact.value.otherContacts ?? []).length > 0,
)

const showPointOfContactNoContactsError = computed(
  () => showPointOfContactSelected.value && !hasOtherContacts.value,
)

const showPreferredPointOfContactSelect = computed(
  () => showPointOfContactSelected.value && hasOtherContacts.value,
)

const hasCommunicationConsent = computed(
  () => hasConsent(contact.value),
)

const communicationAuthorizationLabel = computed(() =>
  showPointOfContactSelected.value
    ? t('communicationAuthorizationPointOfContact')
    : t('communicationAuthorizationMethod'),
)

const pointOfContactOptions = computed(() =>
  (contact.value.otherContacts ?? []).map((other, index) => ({
    label: resolvePointOfContactSelectLabel(other, index, t, {
      contactTypeOptions: contactTypeOptions.value,
      relationshipTypeOptions: relationshipTypeOptions.value,
    }),
    value: other.id,
  })),
)

function onClientStateChange() {
  contact.value.city = ''
  contact.value.county = ''
}

function onClientCityChange() {
  contact.value.county = ''
}

function onPhoneInput(index, val) {
  contact.value.phones[index].number = formatPhoneUs(val)
}

function addPhone() {
  contact.value.phones.push(createEmptyPhone())
}

function removePhone(index) {
  contact.value.phones.splice(index, 1)
}

function addEmail() {
  contact.value.emails.push(createEmptyEmail())
}

function removeEmail(index) {
  contact.value.emails.splice(index, 1)
}

function isPreferredComm(value) {
  return isPreferredCommunicationSelected(
    contact.value.preferredCommunication,
    value,
  )
}

function onPreferredCommToggle(value) {
  togglePreferredCommunication(contact.value, value)
}

function onCommunicationAuthorizationChange(checked) {
  setCommunicationAuthorization(contact.value, checked)
}

watch(
  () => contact.value.preferredPointOfContactId,
  () => {
    syncPreferredPointOfContactFlags(contact.value)
  },
)

</script>
