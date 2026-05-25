<template>
  <div class="other-contact-panel">
    <div class="row q-col-gutter-sm q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-select
          :model-value="contact.relationshipType"
          outlined
          hide-bottom-space
          emit-value
          map-options
          clearable
          :options="relationshipTypeOptions"
          :label="t('relationshipType')"
          @update:model-value="setField('relationshipType', $event)"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          :model-value="contact.contactType"
          outlined
          hide-bottom-space
          emit-value
          map-options
          clearable
          :options="contactTypeOptions"
          :label="t('contactType')"
          @update:model-value="setField('contactType', $event)"
        />
      </div>
      <div class="col-12">
        <div class="add-client-form__checkbox-field">
          <q-checkbox
            :model-value="contact.responsibleForPayments"
            :label="t('responsibleForPayments')"
            @update:model-value="setField('responsibleForPayments', $event)"
          />
        </div>
      </div>
      <div class="col-12 col-md-6">
        <TextInput
          :model-value="contact.firstName"
          :label="t('otherContactFirstName')"
          :rules="rules.otherFirstName"
          maxlength="30"
          @update:model-value="setField('firstName', $event)"
        />
      </div>
      <div class="col-12 col-md-6">
        <TextInput
          :model-value="contact.lastName"
          :label="t('otherContactLastName')"
          :rules="rules.otherLastName"
          maxlength="30"
          @update:model-value="setField('lastName', $event)"
        />
      </div>
      <div class="col-12 col-md-6">
        <TextInput
          :model-value="contact.middleName"
          :label="t('otherContactMiddleName')"
          :rules="rules.otherMiddleName"
          maxlength="30"
          @update:model-value="setField('middleName', $event)"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          :model-value="contact.suffix"
          outlined
          hide-bottom-space
          emit-value
          map-options
          clearable
          :options="suffixOptions"
          :label="t('suffix')"
          @update:model-value="setField('suffix', $event)"
        />
      </div>
    </div>

    <div class="add-client-form__other-contact-address-box q-mt-md">
      <AddClientSubsectionHeading
        icon="place"
        :title="t('contactAddress')"
      />
      <q-checkbox
        :model-value="contact.sameAsClientAddress"
        :label="t('sameAsClientAddress')"
        class="q-mb-md"
        @update:model-value="onSameAsClientAddress"
      />
      <div class="row q-col-gutter-sm q-col-gutter-md">
        <div class="col-12 col-md-6">
          <TextInput
            :model-value="contact.addressLine1"
            :label="t('addressLine1')"
            :rules="rules.addressLine1"
            :disable="addressDisabled"
            maxlength="100"
            @update:model-value="setField('addressLine1', $event)"
          />
        </div>
        <div class="col-12 col-md-6">
          <TextInput
            :model-value="contact.addressLine2"
            :label="t('addressLine2Optional')"
            :rules="rules.addressLine2"
            :disable="addressDisabled"
            maxlength="100"
            @update:model-value="setField('addressLine2', $event)"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-select
            :model-value="contact.state"
            outlined
            hide-bottom-space
            emit-value
            map-options
            clearable
            :disable="addressDisabled"
            :options="stateOptions"
            :label="t('state')"
            @update:model-value="onStateChange"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-select
            :model-value="contact.city"
            outlined
            hide-bottom-space
            emit-value
            map-options
            clearable
            :disable="addressDisabled || !contact.state"
            :options="cityOptions"
            :label="t('city')"
            @update:model-value="onCityChange"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-select
            :model-value="contact.county"
            outlined
            hide-bottom-space
            emit-value
            map-options
            clearable
            :disable="addressDisabled || !contact.state || !contact.city"
            :options="countyOptions"
            :label="t('county')"
            @update:model-value="setField('county', $event)"
          />
        </div>
        <div class="col-12 col-md-6">
          <TextInput
            :model-value="contact.zipCode"
            :label="t('zipCode')"
            :rules="rules.zipCode"
            :disable="addressDisabled"
            maxlength="11"
            @update:model-value="setField('zipCode', $event)"
          />
        </div>
      </div>
    </div>

    <div class="q-mt-md">
      <div class="add-client-form__contact-methods-block">
        <AddClientSubsectionHeading icon="phone" :title="t('phone')" />
        <div
          v-for="(phone, index) in contact.phones"
          :key="`oc-phone-${index}`"
          class="row q-col-gutter-sm q-col-gutter-md
            add-client-form__contact-method-row">
          <div class="col-12 col-md-6">
            <q-input
              outlined
              hide-bottom-space
              :model-value="phone.number"
              :label="t('phoneNumber')"
              :rules="rules.phoneNumber"
              :placeholder="t('phoneNumberPlaceholder')"
              maxlength="14"
              @update:model-value="val => onPhoneInput(index, val)"
            />
          </div>
          <div class="col-12 col-md-6">
            <div class="row q-col-gutter-sm items-center">
              <div class="col">
                <q-select
                  :model-value="phone.type"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  :options="phoneTypeOptions"
                  :label="t('phoneType')"
                  @update:model-value="setPhoneField(index, 'type', $event)"
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
          :key="`oc-email-${index}`"
          class="row q-col-gutter-sm q-col-gutter-md
            add-client-form__contact-method-row">
          <div class="col-12 col-md-6">
            <TextInput
              :model-value="email.address"
              :label="t('emailAddress')"
              :rules="rules.emailAddress"
              maxlength="32"
              @update:model-value="setEmailField(index, 'address', $event)"
            />
          </div>
          <div class="col-12 col-md-6">
            <div class="row q-col-gutter-sm items-center">
              <div class="col">
                <q-select
                  :model-value="email.type"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  :options="emailTypeOptions"
                  :label="t('emailType')"
                  @update:model-value="setEmailField(index, 'type', $event)"
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import TextInput from 'components/TextInput.vue'
import AddClientSubsectionHeading
  from 'components/AddClientSubsectionHeading.vue'
import AddClientMethodRowActions from 'components/AddClientMethodRowActions.vue'
import {
  getCitiesForState,
  getCountiesForStateCity,
} from 'src/data/us-geography.js'
import {
  copyClientAddressToContact,
  createEmptyEmail,
  createEmptyPhone,
  formatPhoneUs,
} from 'src/utils/client-contact-form.js'

const props = defineProps({
  contact: {
    type: Object,
    required: true,
  },
  clientAddress: {
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
  suffixOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:contact'])

const { t } = useI18n()

const addressDisabled = computed(
  () => Boolean(props.contact.sameAsClientAddress),
)

const cityOptions = computed(() => getCitiesForState(props.contact.state))

const countyOptions = computed(() =>
  getCountiesForStateCity(props.contact.state, props.contact.city),
)

function emitContact(next) {
  emit('update:contact', next)
}

function setField(key, value) {
  emitContact({ ...props.contact, [key]: value })
}

function setPhoneField(index, key, value) {
  const phones = props.contact.phones.map((p, i) =>
    i === index ? { ...p, [key]: value } : p,
  )
  emitContact({ ...props.contact, phones })
}

function setEmailField(index, key, value) {
  const emails = props.contact.emails.map((e, i) =>
    i === index ? { ...e, [key]: value } : e,
  )
  emitContact({ ...props.contact, emails })
}

function onPhoneInput(index, val) {
  setPhoneField(index, 'number', formatPhoneUs(val))
}

function addPhone() {
  emitContact({
    ...props.contact,
    phones: [...props.contact.phones, createEmptyPhone()],
  })
}

function removePhone(index) {
  const phones = props.contact.phones.filter((_, i) => i !== index)
  emitContact({ ...props.contact, phones })
}

function addEmail() {
  emitContact({
    ...props.contact,
    emails: [...props.contact.emails, createEmptyEmail()],
  })
}

function removeEmail(index) {
  const emails = props.contact.emails.filter((_, i) => i !== index)
  emitContact({ ...props.contact, emails })
}

function onStateChange(val) {
  emitContact({
    ...props.contact,
    state: val,
    city: '',
    county: '',
  })
}

function onCityChange(val) {
  emitContact({
    ...props.contact,
    city: val,
    county: '',
  })
}

function onSameAsClientAddress(val) {
  const next = { ...props.contact, sameAsClientAddress: val }
  if (val) {
    copyClientAddressToContact(props.clientAddress, next)
  }
  emitContact(next)
}

watch(
  () => props.clientAddress,
  addr => {
    if (props.contact.sameAsClientAddress) {
      const next = { ...props.contact }
      copyClientAddressToContact(addr, next)
      emitContact(next)
    }
  },
  { deep: true },
)
</script>
