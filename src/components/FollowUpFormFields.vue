<template>
  <div class="follow-up-form-fields">
    <div class="follow-up-form-fields__section">
      <SubsectionHeading
        icon="event_note"
        :title="t('followUpSectionInfo')"
      />
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('followUpType')"
            required
            :test-id="tid.field('type')">
            <FormSelect
              v-model="local.type"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :readonly="props.readonly"
              :options="typeOptions"
              :placeholder="t('followUpTypePlaceholder')"
              :error="Boolean(props.errors.type)"
              :error-message="props.errors.type"
              :test-id="tid.field('type')"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('followUpDueDate')"
            required
            :test-id="tid.field('due-date')">
            <ClientDateField
              v-model="local.dueDate"
              :readonly="props.readonly"
              :error="Boolean(props.errors.dueDate)"
              :error-message="props.errors.dueDate"
              :close-label="t('close')"
              :test-id="tid.field('due-date')"
            />
          </AddClientLabeledField>
        </div>
      </div>
    </div>

    <div class="follow-up-form-fields__section q-mt-lg">
      <SubsectionHeading
        icon="tune"
        :title="t('followUpSectionDetails')"
      />
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('followUpPriority')"
            :test-id="tid.field('priority')">
            <FormSelect
              v-model="local.priority"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :readonly="props.readonly"
              :clearable="false"
              :options="priorityOptions"
              :test-id="tid.field('priority')"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('followUpAssignedProvider')"
            required
            :test-id="tid.field('provider')">
            <FormSelect
              v-model="local.assignedProviderId"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :readonly="props.readonly"
              :options="props.clinicianOptions"
              :placeholder="t('followUpAssignedProviderPlaceholder')"
              :error="Boolean(props.errors.assignedProviderId)"
              :error-message="props.errors.assignedProviderId"
              :test-id="tid.field('provider')"
            />
          </AddClientLabeledField>
        </div>
      </div>
    </div>

    <div class="follow-up-form-fields__section q-mt-lg">
      <SubsectionHeading
        icon="link"
        :title="t('followUpSectionRelated')"
      />
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('followUpRelatedTo')"
            :test-id="tid.field('related-to')">
            <FormSelect
              v-model="local.relatedTo"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :readonly="props.readonly"
              :options="relatedToOptions"
              :placeholder="t('followUpRelatedToPlaceholder')"
              :test-id="tid.field('related-to')"
            />
          </AddClientLabeledField>
        </div>
        <div
          v-if="showReferenceField"
          class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('followUpReference')"
            :required="referenceRequired && !props.readonly"
            :test-id="tid.field('reference')">
            <q-input
              v-if="props.readonly && local.referenceLabel"
              :model-value="local.referenceLabel"
              outlined
              hide-bottom-space
              readonly
              :data-testid="tid.field('reference')"
            />
            <q-select
              v-else
              v-model="local.reference"
              outlined
              hide-bottom-space
              use-input
              fill-input
              hide-selected
              input-debounce="300"
              emit-value
              map-options
              option-value="reference"
              option-label="label"
              :readonly="props.readonly"
              :loading="props.referenceLoading"
              :options="filteredReferenceOptions"
              :placeholder="t('followUpReferencePlaceholder')"
              :error="Boolean(props.errors.reference)"
              :error-message="props.errors.reference"
              :data-testid="tid.field('reference')"
              @filter="onReferenceFilter"
              @update:model-value="onReferenceSelected">
              <template #prepend>
                <q-icon name="search" />
              </template>
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label
                      v-if="scope.opt.subtitle"
                      caption>
                      {{ scope.opt.subtitle }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <template #hint>
              {{ t('followUpReferenceSearchHint') }}
            </template>
          </AddClientLabeledField>
        </div>
      </div>
    </div>

    <div class="follow-up-form-fields__section q-mt-lg">
      <SubsectionHeading
        icon="notes"
        :title="t('followUpSectionNotes')"
      />
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12">
          <AddClientLabeledField
            :label="t('followUpNotes')"
            :test-id="tid.field('notes')">
            <q-input
              v-model="local.notes"
              outlined
              hide-bottom-space
              type="textarea"
              autogrow
              :readonly="props.readonly"
              :maxlength="followUpNotesMaxLength"
              :placeholder="t('followUpNotesPlaceholder')"
              :error="Boolean(props.errors.notes)"
              :error-message="props.errors.notes"
              :data-testid="tid.field('notes')"
            />
          </AddClientLabeledField>
        </div>
      </div>
    </div>

    <div class="follow-up-form-fields__section q-mt-lg">
      <SubsectionHeading
        icon="notifications_active"
        :title="t('followUpSectionReminder')"
      />
      <div class="row q-col-gutter-md q-mt-md items-center">
        <div class="col-12 col-md-4">
          <FormToggle
            v-model="local.reminderEnabled"
            :label="t('followUpSendReminder')"
            :disable="props.readonly"
            :test-id="tid.field('reminder-enabled')"
          />
        </div>
        <div class="col-6 col-md-4">
          <AddClientLabeledField
            :label="t('followUpReminderValue')"
            :test-id="tid.field('reminder-value')">
            <FormSelect
              v-model="local.reminderValue"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :readonly="props.readonly || !local.reminderEnabled"
              :clearable="false"
              :options="reminderValueOptions"
              :error="Boolean(props.errors.reminderValue)"
              :error-message="props.errors.reminderValue"
              :test-id="tid.field('reminder-value')"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-6 col-md-4">
          <AddClientLabeledField
            :label="t('followUpReminderUnit')"
            :test-id="tid.field('reminder-unit')">
            <FormSelect
              v-model="local.reminderUnit"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :readonly="props.readonly || !local.reminderEnabled"
              :clearable="false"
              :options="reminderUnitOptions"
              :error="Boolean(props.errors.reminderUnit)"
              :error-message="props.errors.reminderUnit"
              :test-id="tid.field('reminder-unit')"
            />
          </AddClientLabeledField>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import { followUpNotesMaxLength } from 'components/constants.js'
import {
  followUpRelatedToRequiresReference,
  referenceLabelFromOptions,
} from 'src/utils/follow-up-reference.js'
import {
  buildFollowUpPriorityOptions,
  buildFollowUpRelatedToOptions,
  buildFollowUpReminderUnitOptions,
  buildFollowUpReminderValueOptions,
  buildFollowUpTypeOptions,
} from 'src/utils/follow-up-utils.js'
import { followUpTestIds as tid } from 'src/test-ids/index.js'

const local = defineModel({ type: Object, required: true })

const props = defineProps({
  errors: {
    type: Object,
    default: () => ({}),
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  referenceOptions: {
    type: Array,
    default: () => [],
  },
  referenceLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['related-to-change'])

const { t } = useI18n()

const typeOptions = computed(() => buildFollowUpTypeOptions(t))
const priorityOptions = computed(() => buildFollowUpPriorityOptions(t))
const relatedToOptions = computed(() => buildFollowUpRelatedToOptions(t))
const reminderUnitOptions = computed(() => buildFollowUpReminderUnitOptions(t))
const reminderValueOptions = buildFollowUpReminderValueOptions()

const filteredReferenceOptions = ref([])

const showReferenceField = computed(() =>
  followUpRelatedToRequiresReference(local.value.relatedTo),
)

const referenceRequired = computed(() => showReferenceField.value)

watch(
  () => props.referenceOptions,
  options => {
    filteredReferenceOptions.value = [...(options ?? [])]
  },
  { immediate: true, deep: true },
)

watch(
  () => local.value.relatedTo,
  (next, prev) => {
    if (next === prev) {
      return
    }
    local.value = {
      ...local.value,
      reference: null,
      referenceLabel: '',
    }
    emit('related-to-change', next)
  },
)

watch(
  () => local.value.reminderEnabled,
  enabled => {
    if (!enabled) {
      return
    }
    if (local.value.reminderValue == null) {
      local.value = {
        ...local.value,
        reminderValue: 3,
      }
    }
    if (!local.value.reminderUnit) {
      local.value = {
        ...local.value,
        reminderUnit: reminderUnitOptions.value[0]?.value ?? null,
      }
    }
  },
)

function onReferenceFilter(val, update) {
  update(() => {
    const needle = String(val ?? '').trim().toLowerCase()
    if (!needle) {
      filteredReferenceOptions.value = [...(props.referenceOptions ?? [])]

      return
    }
    filteredReferenceOptions.value = (props.referenceOptions ?? []).filter(
      opt => String(opt.label ?? '').toLowerCase().includes(needle)
        || String(opt.subtitle ?? '').toLowerCase().includes(needle),
    )
  })
}

function onReferenceSelected(value) {
  local.value = {
    ...local.value,
    reference: value,
    referenceLabel: referenceLabelFromOptions(
      value,
      props.referenceOptions,
    ),
  }
}
</script>

<style lang="scss" scoped>
.follow-up-form-fields {
  &__section:first-child {
    margin-top: 0;
  }
}
</style>
