<template>
  <div class="appointment-recurrence-section q-mt-md">
    <FormToggle
      v-model="local.repeatAppointment"
      :disable="readonly"
      :label="t('appointmentRepeatLabel')"
    />

    <div
      v-if="local.repeatAppointment"
      class="row q-col-gutter-md q-mt-md">
      <div class="col-12 col-md-4">
        <AddClientLabeledField :label="t('appointmentRecurrenceFrequency')">
          <FormSelect
            v-model="local.recurrence.frequency"
            :options="frequencyOptions"
            :readonly="readonly"
          />
        </AddClientLabeledField>
      </div>
      <div class="col-12 col-md-4">
        <AddClientLabeledField :label="t('appointmentRecurrenceInterval')">
          <TextInput
            v-model="local.recurrence.intervalCount"
            type="number"
            :external-label="true"
            :readonly="readonly"
          />
        </AddClientLabeledField>
      </div>
      <div
        v-if="local.recurrence.frequency === frequencyWeekly"
        class="col-12">
        <AddClientLabeledField :label="t('appointmentRecurrenceDays')">
          <q-option-group
            v-model="local.recurrence.daysOfWeek"
            type="checkbox"
            inline
            :disable="readonly"
            :options="weekdayOptions"
          />
        </AddClientLabeledField>
      </div>
      <div class="col-12 col-md-4">
        <AddClientLabeledField :label="t('appointmentRecurrenceEnds')">
          <FormSelect
            v-model="local.recurrence.endType"
            :options="endTypeOptions"
            :readonly="readonly"
          />
        </AddClientLabeledField>
      </div>
      <div
        v-if="local.recurrence.endType === endAfterCount"
        class="col-12 col-md-4">
        <AddClientLabeledField :label="t('appointmentRecurrenceCount')">
          <TextInput
            v-model="local.recurrence.endAfterCount"
            type="number"
            :external-label="true"
            :readonly="readonly"
          />
        </AddClientLabeledField>
      </div>
      <div
        v-if="local.recurrence.endType === endOnDate"
        class="col-12 col-md-4">
        <AddClientLabeledField :label="t('appointmentRecurrenceEndDate')">
          <ClientDateField
            v-model="local.recurrence.endOnDate"
            :readonly="readonly"
          />
        </AddClientLabeledField>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  appointmentRecurrenceEndTypeValues,
  appointmentRecurrenceFrequencyValues,
} from 'components/constants.js'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import TextInput from 'components/TextInput.vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const frequencyWeekly = appointmentRecurrenceFrequencyValues.weekly
const endAfterCount = appointmentRecurrenceEndTypeValues.afterCount
const endOnDate = appointmentRecurrenceEndTypeValues.onDate

const local = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const frequencyOptions = computed(() => [
  {
    label: t('appointmentRecurrenceDaily'),
    value: appointmentRecurrenceFrequencyValues.daily,
  },
  {
    label: t('appointmentRecurrenceWeekly'),
    value: appointmentRecurrenceFrequencyValues.weekly,
  },
  {
    label: t('appointmentRecurrenceMonthly'),
    value: appointmentRecurrenceFrequencyValues.monthly,
  },
])

const endTypeOptions = computed(() => [
  {
    label: t('appointmentRecurrenceAfterCount'),
    value: endAfterCount,
  },
  {
    label: t('appointmentRecurrenceOnDate'),
    value: endOnDate,
  },
])

const weekdayOptions = computed(() => [
  { label: t('weekdayMon'), value: 1 },
  { label: t('weekdayTue'), value: 2 },
  { label: t('weekdayWed'), value: 3 },
  { label: t('weekdayThu'), value: 4 },
  { label: t('weekdayFri'), value: 5 },
  { label: t('weekdaySat'), value: 6 },
  { label: t('weekdaySun'), value: 7 },
])
</script>
