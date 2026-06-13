<template>
  <div class="other-contact-panel">
    <div class="row q-col-gutter-sm q-col-gutter-md">
      <div class="col-12 col-md-6">
        <AddClientLabeledField
          :label="t('relationshipType')"
          :test-id="ocField('relationshipType')">
          <FormSelect
            :model-value="contact.relationshipType"
            :test-id="ocField('relationshipType')"
            outlined
            hide-bottom-space
            emit-value
            map-options
            clearable
            class="full-width"
            :loading="catalogsLoading"
            :options="relationshipTypeOptions"
            @update:model-value="setField('relationshipType', $event)"
          />
        </AddClientLabeledField>
      </div>
      <div class="col-12 col-md-6">
        <AddClientLabeledField
          :label="t('contactType')"
          :test-id="ocField('contactType')">
          <FormSelect
            :model-value="contact.contactType"
            :test-id="ocField('contactType')"
            outlined
            hide-bottom-space
            emit-value
            map-options
            clearable
            class="full-width"
            :loading="catalogsLoading"
            :options="contactTypeOptions"
            @update:model-value="setField('contactType', $event)"
          />
        </AddClientLabeledField>
      </div>
      <div class="col-12 col-md-6">
        <AddClientLabeledField
          :label="t('prefix')"
          :test-id="ocField('prefix')">
          <FormSelect
            :model-value="contact.prefix"
            :test-id="ocField('prefix')"
            outlined
            hide-bottom-space
            emit-value
            map-options
            clearable
            class="full-width"
            :loading="catalogsLoading"
            :options="prefixOptions"
            :placeholder="t('prefixSelect')"
            @update:model-value="setField('prefix', $event)"
          />
        </AddClientLabeledField>
      </div>
      <div class="col-12 col-md-6">
        <FormInput
          :model-value="contact.firstName"
          :external-label="true"
          :label="t('otherContactFirstName')"
          :rules="rules.otherFirstName"
          maxlength="30"
          :test-id="ocField('firstName')"
          @update:model-value="setField('firstName', $event)"
        />
      </div>
      <div class="col-12 col-md-6">
        <FormInput
          :model-value="contact.middleName"
          :external-label="true"
          :label="t('otherContactMiddleName')"
          :rules="rules.otherMiddleName"
          maxlength="30"
          :test-id="ocField('middleName')"
          @update:model-value="setField('middleName', $event)"
        />
      </div>
      <div class="col-12 col-md-6">
        <FormInput
          :model-value="contact.lastName"
          :external-label="true"
          :label="t('otherContactLastName')"
          :rules="rules.otherLastName"
          maxlength="30"
          :test-id="ocField('lastName')"
          @update:model-value="setField('lastName', $event)"
        />
      </div>
      <div class="col-12 col-md-6">
        <AddClientLabeledField
          :label="t('suffix')"
          :test-id="ocField('suffix')">
          <FormSelect
            :model-value="contact.suffix"
            :test-id="ocField('suffix')"
            outlined
            hide-bottom-space
            emit-value
            map-options
            clearable
            class="full-width"
            :loading="catalogsLoading"
            :options="suffixOptions"
            :placeholder="t('suffixSelect')"
            @update:model-value="setField('suffix', $event)"
          />
        </AddClientLabeledField>
      </div>
      <div class="col-12 col-md-6">
        <div class="toggle-field">
          <FormToggle
            :model-value="contact.responsibleForPayments"
            :label="t('responsibleForPayments')"
            :test-id="ocField('responsibleForPayments')"
            @update:model-value="onResponsibleForPaymentsChange"
          />
        </div>
      </div>
    </div>

    <div class="other-contact-address-box q-mt-md">
      <SubsectionHeading
        icon="place"
        :title="t('contactAddress')"
      />
      <FormToggle
        :model-value="contact.sameAsClientAddress"
        :label="t('sameAsClientAddress')"
        class="q-mb-md"
        :test-id="ocField('sameAsClientAddress')"
        @update:model-value="onSameAsClientAddress"
      />
      <div class="row q-col-gutter-sm q-col-gutter-md">
        <div class="col-12 col-md-6">
          <FormInput
            :model-value="contact.addressLine1"
            :external-label="true"
            :label="t('addressLine1')"
            :rules="rules.addressLine1"
            :disable="addressDisabled"
            maxlength="100"
            :test-id="ocField('addressLine1')"
            @update:model-value="setField('addressLine1', $event)"
          />
        </div>
        <div class="col-12 col-md-6">
          <FormInput
            :model-value="contact.addressLine2"
            :external-label="true"
            :label="t('addressLine2Optional')"
            :rules="rules.addressLine2"
            :disable="addressDisabled"
            maxlength="100"
            :test-id="ocField('addressLine2')"
            @update:model-value="setField('addressLine2', $event)"
          />
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('state')"
            :test-id="ocField('state')">
            <FormSelect
              :model-value="contact.state"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              class="full-width"
              :disable="addressDisabled"
              :options="stateOptions"
              :test-id="ocField('state')"
              @update:model-value="onStateChange"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('city')"
            :test-id="ocField('city')">
            <FormSelect
              :model-value="contact.city"
              :test-id="ocField('city')"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              class="full-width"
              :disable="addressDisabled || !contact.state"
              :options="cityOptions"
              @update:model-value="onCityChange"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('county')"
            :test-id="ocField('county')">
            <FormSelect
              :model-value="contact.county"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              class="full-width"
              :disable="addressDisabled || !contact.state || !contact.city"
              :options="countyOptions"
              :test-id="ocField('county')"
              @update:model-value="setField('county', $event)"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <FormInput
            :model-value="contact.zipCode"
            :external-label="true"
            :label="t('zipCode')"
            :rules="rules.zipCode"
            :disable="addressDisabled"
            maxlength="11"
            :test-id="ocField('zipCode')"
            @update:model-value="setField('zipCode', $event)"
          />
        </div>
      </div>
    </div>

    <div class="q-mt-md">
      <div class="contact-methods-block">
        <SubsectionHeading icon="phone" :title="t('phone')" />
        <div
          v-for="(phone, index) in contact.phones"
          :key="`oc-phone-${index}`"
          class="row q-col-gutter-sm q-col-gutter-md
            contact-method-row">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('phoneNumber')"
              :test-id="ocField(`phone-${index}-number`)">
              <q-input
                outlined
                hide-bottom-space
                lazy-rules="ondemand"
                class="full-width"
                :data-testid="ocField(`phone-${index}-number`)"
                :model-value="phone.number"
                :rules="phoneNumberRules(index)"
                :placeholder="t('phoneNumberPlaceholder')"
                maxlength="14"
                @update:model-value="val => onPhoneInput(index, val)"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('phoneType')"
              :test-id="ocField(`phone-${index}-type`)">
              <div
                class="row q-col-gutter-sm items-center
                  contact-method-type-row">
                <div class="col">
                  <FormSelect
                    :model-value="phone.type"
                    outlined
                    hide-bottom-space
                    emit-value
                    map-options
                    clearable
                    class="full-width"
                    :options="phoneTypeOptions"
                    :test-id="ocField(`phone-${index}-type`)"
                    @update:model-value="setPhoneField(index, 'type', $event)"
                  />
                </div>
                <AddClientMethodRowActions
                  :is-last="index === contact.phones.length - 1"
                  :total="contact.phones.length"
                  :add-label="t('addPhone')"
                  :remove-label="t('removePhone')"
                  :add-test-id="otherContactPhoneAddTestId(contact.id, index)"
                  :remove-test-id="
                    otherContactPhoneRemoveTestId(contact.id, index)"
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
          :key="`oc-email-${index}`"
          class="row q-col-gutter-sm q-col-gutter-md
            contact-method-row">
          <div class="col-12 col-md-6">
            <FormInput
              :model-value="email.address"
              :external-label="true"
              :label="t('emailAddress')"
              :placeholder="t('emailAddressPlaceholder')"
              :rules="emailAddressRules(index)"
              maxlength="32"
              :test-id="ocField(`email-${index}-address`)"
              @update:model-value="setEmailField(index, 'address', $event)"
            />
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('emailType')"
              :test-id="ocField(`email-${index}-type`)">
              <div
                class="row q-col-gutter-sm items-center
                  contact-method-type-row">
                <div class="col">
                  <FormSelect
                    :model-value="email.type"
                    outlined
                    hide-bottom-space
                    emit-value
                    map-options
                    clearable
                    class="full-width"
                    :options="emailTypeOptions"
                    :test-id="ocField(`email-${index}-type`)"
                    @update:model-value="setEmailField(index, 'type', $event)"
                  />
                </div>
                <AddClientMethodRowActions
                  :is-last="index === contact.emails.length - 1"
                  :total="contact.emails.length"
                  :add-label="t('addEmail')"
                  :remove-label="t('removeEmail')"
                  :add-test-id="otherContactEmailAddTestId(contact.id, index)"
                  :remove-test-id="
                    otherContactEmailRemoveTestId(contact.id, index)"
                  @add="addEmail"
                  @remove="removeEmail(index)"
                />
              </div>
            </AddClientLabeledField>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FormInput from './FormInput.vue'
import FormToggle from 'components/FormToggle.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import SubsectionHeading
  from './SubsectionHeading.vue'
import AddClientMethodRowActions from 'components/AddClientMethodRowActions.vue'
import {
  getCitiesForState,
  getCountiesForStateCity,
} from 'src/data/us-geography.js'
import {
  clearContactAddress,
  copyClientAddressToContact,
  createEmptyEmail,
  createEmptyPhone,
  formatPhoneUs,
} from 'src/utils/client-contact-form.js'
import { useContactMethodDuplicateRules }
  from 'src/composables/useContactMethodDuplicateRules.js'
import {
  otherContactEmailAddTestId,
  otherContactEmailRemoveTestId,
  otherContactFieldTestId,
  otherContactPhoneAddTestId,
  otherContactPhoneRemoveTestId,
} from 'src/test-ids/index.js'

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

const emit = defineEmits([
  'update:contact',
  'set-responsible-for-payments',
])

const { t } = useI18n()
const {
  phoneNumberRules: buildPhoneNumberRules,
  emailAddressRules: buildEmailAddressRules,
} = useContactMethodDuplicateRules(t)

function phoneNumberRules(index) {
  return buildPhoneNumberRules(
    props.contact.phones,
    index,
    props.rules?.phoneNumber ?? [],
  )
}

function emailAddressRules(index) {
  return buildEmailAddressRules(
    props.contact.emails,
    index,
    props.rules?.emailAddress ?? [],
  )
}

function ocField(name) {
  return otherContactFieldTestId(`${props.contact.id}-${name}`)
}

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

function onResponsibleForPaymentsChange(value) {
  emit('set-responsible-for-payments', {
    contactId: props.contact.id,
    value,
  })
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
  } else {
    clearContactAddress(next)
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
