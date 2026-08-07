<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        :info="t('carePlanAddMeasurementSubtitle')"
        @close="onCancel">
        {{ t('carePlanAddMeasurementTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="care-plan-measurement-summary q-mb-md">
          <div class="care-plan-measurement-summary__row">
            <div class="care-plan-measurement-summary__metric
              care-plan-measurement-summary__metric--primary">
              <div class="care-plan-measurement-summary__icon">
                <q-icon name="show_chart" size="18px" color="primary" />
              </div>
              <span class="care-plan-measurement-summary__label">
                {{ t('carePlanOutcomeMeasureLabel') }}
              </span>
              <span class="care-plan-measurement-summary__value
                care-plan-measurement-summary__value--strong">
                {{ measureName }}
              </span>
            </div>
            <div class="care-plan-measurement-summary__metric">
              <span class="care-plan-measurement-summary__label">
                {{ t('carePlanMeasureBaseline') }}
              </span>
              <span class="care-plan-measurement-summary__value
                care-plan-measurement-summary__value--accent">
                {{ formatWithUnit(measure?.baseline) }}
              </span>
            </div>
            <div class="care-plan-measurement-summary__metric">
              <span class="care-plan-measurement-summary__label">
                {{ t('carePlanMeasureTarget') }}
              </span>
              <span class="care-plan-measurement-summary__value
                care-plan-measurement-summary__value--accent">
                {{ formatWithUnit(measure?.target) }}
              </span>
            </div>
            <div class="care-plan-measurement-summary__metric">
              <span class="care-plan-measurement-summary__label">
                {{ t('carePlanMeasureDirection') }}
              </span>
              <span class="care-plan-measurement-summary__value
                care-plan-measurement-summary__value--accent">
                {{ directionLabel }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="hasPreviousMeasurement"
          class="care-plan-measurement-summary q-mb-md">
          <div class="care-plan-measurement-summary__row">
            <div class="care-plan-measurement-summary__metric
              care-plan-measurement-summary__metric--primary">
              <div class="care-plan-measurement-summary__icon">
                <q-icon name="history" size="18px" color="primary" />
              </div>
              <span class="care-plan-measurement-summary__label">
                {{ t('carePlanPreviousMeasurement') }}
              </span>
            </div>
            <div class="care-plan-measurement-summary__metric">
              <span class="care-plan-measurement-summary__label">
                {{ t('carePlanMeasurementValue') }}
              </span>
              <span class="care-plan-measurement-summary__value
                care-plan-measurement-summary__value--accent">
                {{ formatWithUnit(measure?.currentValue) }}
              </span>
            </div>
            <div class="care-plan-measurement-summary__metric">
              <span class="care-plan-measurement-summary__label">
                {{ t('carePlanMeasuredDate') }}
              </span>
              <span class="care-plan-measurement-summary__value
                care-plan-measurement-summary__value--accent">
                {{ measure?.measuredDate || '—' }}
              </span>
            </div>
          </div>
        </div>

        <div class="insurance-info-banner q-mb-md">
          <q-icon name="info_outline" size="18px" />
          <span>{{ t('carePlanAddMeasurementBanner') }}</span>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('carePlanMeasurementCurrentValue')"
              required
              :test-id="tid.field('measurement-value')">
              <q-input
                v-model="local.currentValue"
                outlined
                hide-bottom-space
                type="number"
                :placeholder="t('carePlanMeasureCurrentPlaceholder')"
                :error="Boolean(errors.currentValue)"
                :error-message="errors.currentValue"
                :data-testid="tid.field('measurement-value')">
                <template v-if="unitLabel" #append>
                  <span class="text-grey-7">{{ unitLabel }}</span>
                </template>
              </q-input>
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('carePlanMeasuredDate')"
              required
              :test-id="tid.field('measurement-date')">
              <ClientDateField
                v-model="local.measuredDate"
                :max-today="true"
                :error="Boolean(errors.measuredDate)"
                :error-message="errors.measuredDate"
                :close-label="t('close')"
                :test-id="tid.field('measurement-date')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('notes')"
              :test-id="tid.field('measurement-notes')">
              <q-input
                v-model="local.notes"
                outlined
                hide-bottom-space
                type="textarea"
                autogrow
                counter
                :maxlength="carePlanMeasureNotesMaxLength"
                :placeholder="t('carePlanMeasurementNotesPlaceholder')"
                :data-testid="tid.field('measurement-notes')"
              />
            </AddClientLabeledField>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('carePlanSaveMeasurement')"
          :data-testid="tid.btn('save-measurement')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import { carePlanMeasureNotesMaxLength } from 'components/constants.js'
import { todayDateUs } from 'src/utils/client-form.js'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  measure: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const local = ref({
  currentValue: '',
  measuredDate: todayDateUs(),
  notes: '',
})
const errors = reactive({})

const measureName = computed(
  () => String(props.measure?.measureName ?? '').trim() || '—',
)

const unitLabel = computed(
  () => String(props.measure?.unit ?? '').trim(),
)

const directionLabel = computed(() => {
  const direction = props.measure?.direction
  if (!direction) {
    return '—'
  }
  const key = carePlanI18nKey('carePlanDirection', direction)
  const translated = t(key)

  return translated !== key ? translated : direction
})

const hasPreviousMeasurement = computed(() => {
  const value = props.measure?.currentValue

  return value != null && value !== ''
})

watch(
  () => [props.modelValue, props.measure],
  () => {
    if (!props.modelValue) {
      return
    }
    local.value = {
      currentValue: '',
      measuredDate: todayDateUs(),
      notes: '',
    }
    Object.keys(errors).forEach(key => delete errors[key])
  },
)

function formatWithUnit(value) {
  if (value == null || value === '') {
    return '—'
  }
  const unit = unitLabel.value

  return unit ? `${value} ${unit}` : String(value)
}

function validate() {
  Object.keys(errors).forEach(key => delete errors[key])
  if (local.value.currentValue == null || local.value.currentValue === '') {
    errors.currentValue = t('carePlanMeasurementValueRequired')
  }
  if (!String(local.value.measuredDate ?? '').trim()) {
    errors.measuredDate = t('carePlanMeasuredDateRequired')
  }

  return !Object.keys(errors).length
}

function onSave() {
  if (!validate()) {
    return
  }
  emit('save', {
    measureId: props.measure?.id,
    currentValue: local.value.currentValue,
    measuredDate: local.value.measuredDate,
    notes: String(local.value.notes ?? '').trim(),
  })
  open.value = false
}

function onCancel() {
  emit('cancel')
  open.value = false
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.care-plan-measurement-summary {
  padding: 12px 16px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 28px;
  }

  &__metric {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    &--primary {
      flex: 1 1 auto;
    }
  }

  &__icon {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: rgba($primary, 0.1);
  }

  &__label {
    font-size: 0.8125rem;
    line-height: 1.35;
    color: $text-muted;
    white-space: nowrap;
  }

  &__value {
    font-size: 0.875rem;
    line-height: 1.35;
    word-break: break-word;

    &--strong {
      font-weight: 700;
      color: $text-strong;
    }

    &--accent {
      font-weight: 600;
      color: $primary;
    }
  }
}
</style>
