<template>
  <div class="add-client-contact-tab">
    <AddClientAccordionSection icon="place" :title="t('clientAddress')">
      <div class="row q-col-gutter-sm q-col-gutter-md">
          <div class="col-12 col-md-6">
            <TextInput
              v-model="contact.addressLine1"
              :external-label="true"
              :label="t('addressLine1')"
              :rules="rules.addressLine1"
              maxlength="100"
            />
          </div>
          <div class="col-12 col-md-6">
            <TextInput
              v-model="contact.addressLine2"
              :external-label="true"
              :label="t('addressLine2Optional')"
              :rules="rules.addressLine2"
              maxlength="100"
            />
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('state')">
              <FormSelect
                v-model="contact.state"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                class="full-width"
                :options="stateOptions"
                @update:model-value="onClientStateChange"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('city')">
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
                @update:model-value="onClientCityChange"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('county')">
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
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <TextInput
              v-model="contact.zipCode"
              :external-label="true"
              :label="t('zipCode')"
              :rules="rules.zipCode"
              maxlength="11"
            />
          </div>
        </div>
    </AddClientAccordionSection>

    <q-separator class="add-client-form__section-separator" />

    <AddClientAccordionSection icon="phone" :title="t('contactMethods')">
      <div class="add-client-form__contact-methods-block">
          <AddClientSubsectionHeading icon="phone" :title="t('phone')" />
          <div
            v-for="(phone, index) in contact.phones"
            :key="`phone-${index}`"
            class="row q-col-gutter-sm q-col-gutter-md
              add-client-form__contact-method-row">
            <div class="col-12 col-md-6">
              <AddClientLabeledField :label="t('phoneNumber')">
                <q-input
                  outlined
                  hide-bottom-space
                  class="full-width"
                  :model-value="phone.number"
                  :placeholder="t('phoneNumberPlaceholder')"
                  :rules="rules.phoneNumber"
                  maxlength="14"
                  @update:model-value="val => onPhoneInput(index, val)"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField :label="t('phoneType')">
                <div
                  class="row q-col-gutter-sm items-center
                    add-client-form__contact-method-type-row">
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
                    />
                  </div>
                  <AddClientMethodRowActions
                    :is-last="index === contact.phones.length - 1"
                    :total="contact.phones.length"
                    :add-label="t('addPhone')"
                    :remove-label="t('removePhone')"
                    @add="addPhone"
                    @remove="removePhone(index)"
                  />
                </div>
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="add-client-form__contact-methods-block">
          <AddClientSubsectionHeading
            icon="mail"
            :title="t('contactEmailLabel')"
          />
          <div
            v-for="(email, index) in contact.emails"
            :key="`email-${index}`"
            class="row q-col-gutter-sm q-col-gutter-md
              add-client-form__contact-method-row">
            <div class="col-12 col-md-6">
              <TextInput
                v-model="email.address"
                :external-label="true"
                :label="t('emailAddress')"
                :placeholder="t('emailAddressPlaceholder')"
                :rules="rules.emailAddress"
                maxlength="32"
              />
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField :label="t('emailType')">
                <div
                  class="row q-col-gutter-sm items-center
                    add-client-form__contact-method-type-row">
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
                    />
                  </div>
                  <AddClientMethodRowActions
                    :is-last="index === contact.emails.length - 1"
                    :total="contact.emails.length"
                    :add-label="t('addEmail')"
                    :remove-label="t('removeEmail')"
                    @add="addEmail"
                    @remove="removeEmail(index)"
                  />
                </div>
              </AddClientLabeledField>
            </div>
          </div>
        </div>
    </AddClientAccordionSection>

    <q-separator class="add-client-form__section-separator" />

    <AddClientAccordionSection
      icon="chat"
      :title="t('preferredCommunication')">
      <template #hint>
        <p class="add-client-form__hint">
          {{ t('preferredCommunicationHint') }}
        </p>
      </template>
      <div class="add-client-form__preferred-grid">
          <q-btn
            v-for="opt in communicationOptions"
            :key="opt.value"
            no-caps
            :color="isPreferredComm(opt.value) ? 'primary' : undefined"
            :unelevated="isPreferredComm(opt.value)"
            :outline="!isPreferredComm(opt.value)"
            :class="[
              'add-client-form__preferred-chip',
              {
                'add-client-form__preferred-chip--selected':
                  isPreferredComm(opt.value),
              },
            ]"
            @click="togglePreferredCommunication(opt.value)">
            <q-icon
              :name="opt.icon"
              class="add-client-form__preferred-chip-icon"
            />
            <span class="add-client-form__preferred-chip-label">
              {{ opt.label }}
            </span>
          </q-btn>
        </div>
    </AddClientAccordionSection>

    <q-separator class="add-client-form__section-separator" />

    <OtherContactsSection
      v-model="contact"
      :rules="rules"
      :state-options="stateOptions"
      :phone-type-options="phoneTypeOptions"
      :email-type-options="emailTypeOptions"
      :contact-type-options="contactTypeOptions"
      :relationship-type-options="relationshipTypeOptions"
      :suffix-options="suffixSelectOptions"
    />

    <q-separator class="add-client-form__section-separator" />

    <AddClientAccordionSection
      icon="description"
      :title="t('additionalNotes')">
      <div class="row q-col-gutter-sm q-col-gutter-md">
        <div class="col-12">
          <AddClientLabeledField :label="t('additionalNotes')">
            <q-input
              v-model="contact.additionalNotes"
              outlined
              type="textarea"
              rows="4"
              class="full-width add-client-form__notes-field"
              :placeholder="t('additionalNotesPlaceholder')"
              :rules="rules.additionalNotes"
              maxlength="500"
              counter
            />
          </AddClientLabeledField>
        </div>
      </div>
    </AddClientAccordionSection>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TextInput from 'components/TextInput.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import OtherContactsSection from 'components/OtherContactsSection.vue'
import AddClientAccordionSection from 'components/AddClientAccordionSection.vue'
import AddClientSubsectionHeading
  from 'components/AddClientSubsectionHeading.vue'
import AddClientMethodRowActions from 'components/AddClientMethodRowActions.vue'
import {
  clientContactTypeValues,
  clientEmailTypeValues,
  clientPhoneTypeValues,
  clientPreferredCommunicationValues,
  clientRelationshipTypeValues,
  clientSuffixOptions,
} from 'components/constants.js'
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

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  rules: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])

const contact = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const { t } = useI18n()

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

const contactTypeOptions = computed(() =>
  Object.values(clientContactTypeValues).map(v => ({ label: v, value: v })),
)

const relationshipTypeOptions = computed(() =>
  Object.values(clientRelationshipTypeValues).map(v => ({
    label: v,
    value: v,
  })),
)

const suffixSelectOptions = computed(() =>
  clientSuffixOptions
    .filter(o => o.value)
    .map(o => ({
      label: t(o.labelKey),
      value: o.value,
    })),
)

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
])

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
  return contact.value.preferredCommunication === value
}

function togglePreferredCommunication(value) {
  contact.value.preferredCommunication =
    contact.value.preferredCommunication === value ? '' : value
}

</script>
