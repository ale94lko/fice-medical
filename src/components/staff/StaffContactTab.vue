<template>
  <div class="staff-contact-tab">
    <AccordionSection
      icon="place"
      :title="t('staffAddressSectionTitle')">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('addressLine1')">
            <TextInput
              v-model="contact.address.address"
              :external-label="true"
              :readonly="readonly"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('addressLine2')">
            <TextInput
              v-model="contact.address.address2"
              :external-label="true"
              :readonly="readonly"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('state')">
            <FormSelect
              v-model="contact.address.state"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              :readonly="readonly"
              :options="stateOptions"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('city')">
            <TextInput
              v-model="contact.address.city"
              :external-label="true"
              :readonly="readonly"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('county')">
            <TextInput
              v-model="contact.address.county"
              :external-label="true"
              :readonly="readonly"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('zipCode')">
            <TextInput
              v-model="contact.address.zipCode"
              :external-label="true"
              :readonly="readonly"
            />
          </AddClientLabeledField>
        </div>
      </div>
    </AccordionSection>

    <q-separator class="section-separator q-my-md" />

    <AccordionSection
      icon="contact_phone"
      :title="t('staffContactMethodsTitle')">
      <div class="contact-methods-block">
        <SubsectionHeading icon="phone" :title="t('phone')" />
        <div
          v-for="(phone, index) in contact.phones"
          :key="`phone-${index}`"
          class="row q-col-gutter-md q-mb-md contact-method-row">
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('phoneNumber')">
              <TextInput
                v-model="phone.phoneNumber"
                :external-label="true"
                :readonly="readonly"
                :placeholder="t('phoneNumberPlaceholder')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('type')">
              <div
                class="row q-col-gutter-sm items-center
                  contact-method-type-row">
                <div class="col">
                  <FormSelect
                    v-model="phone.phoneType"
                    outlined
                    hide-bottom-space
                    emit-value
                    map-options
                    clearable
                    :readonly="readonly"
                    :options="phoneTypeOptions"
                  />
                </div>
                <AddClientMethodRowActions
                  v-if="!readonly"
                  :is-last="index === contact.phones.length - 1"
                  :total="contact.phones.length"
                  :can-add="canAddPhone(index)"
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

      <div class="contact-methods-block q-mt-lg">
        <SubsectionHeading icon="mail" :title="t('contactEmailLabel')" />
        <div
          v-for="(emailRow, index) in contact.emails"
          :key="`email-${index}`"
          class="row q-col-gutter-md q-mb-md contact-method-row">
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('emailAddress')">
              <TextInput
                v-model="emailRow.email"
                :external-label="true"
                :readonly="readonly"
                :placeholder="t('emailAddressPlaceholder')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('type')">
              <div
                class="row q-col-gutter-sm items-center
                  contact-method-type-row">
                <div class="col">
                  <FormSelect
                    v-model="emailRow.emailType"
                    outlined
                    hide-bottom-space
                    emit-value
                    map-options
                    clearable
                    :readonly="readonly"
                    :options="emailTypeOptions"
                  />
                </div>
                <AddClientMethodRowActions
                  v-if="!readonly"
                  :is-last="index === contact.emails.length - 1"
                  :total="contact.emails.length"
                  :can-add="canAddEmail(index)"
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
    </AccordionSection>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AccordionSection from 'components/AccordionSection.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AddClientMethodRowActions from 'components/AddClientMethodRowActions.vue'
import FormSelect from 'components/FormSelect.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import TextInput from 'components/TextInput.vue'
import {
  createEmptyStaffEmail,
  createEmptyStaffPhone,
} from 'src/utils/staff-form.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
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
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const contact = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

function canAddPhone(index) {
  const row = contact.value.phones[index]
  return Boolean(String(row?.phoneNumber ?? '').trim())
}

function canAddEmail(index) {
  const row = contact.value.emails[index]
  return Boolean(String(row?.email ?? '').trim())
}

function addPhone() {
  contact.value = {
    ...contact.value,
    phones: [...contact.value.phones, createEmptyStaffPhone()],
  }
}

function removePhone(index) {
  if (contact.value.phones.length <= 1) {
    return
  }
  const phones = [...contact.value.phones]
  phones.splice(index, 1)
  contact.value = { ...contact.value, phones }
}

function addEmail() {
  contact.value = {
    ...contact.value,
    emails: [...contact.value.emails, createEmptyStaffEmail()],
  }
}

function removeEmail(index) {
  if (contact.value.emails.length <= 1) {
    return
  }
  const emails = [...contact.value.emails]
  emails.splice(index, 1)
  contact.value = { ...contact.value, emails }
}
</script>
