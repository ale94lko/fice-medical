<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card
      care-plan-measurement-history-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        :info="t('carePlanMeasurementHistorySubtitle')"
        @close="onClose">
        {{ t('carePlanMeasurementHistoryTitle') }}
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

        <div class="insurance-info-banner q-mb-md">
          <q-icon name="info_outline" size="18px" />
          <span>{{ t('carePlanMeasurementHistoryBanner') }}</span>
        </div>

        <div class="insurance-dialog__card-section q-mb-md">
          <SubsectionHeading
            icon="show_chart"
            :title="t('carePlanProgressOverview')"
          />
          <div
            class="care-plan-progress-overview q-mt-md"
            :class="{
              'care-plan-progress-overview--exceeded': isExceeded,
              'care-plan-progress-overview--regressed': isRegressed,
              'care-plan-progress-overview--has-current': Boolean(
                currentOverviewLabel,
              ),
            }">
            <div
              v-if="currentOverviewLabel"
              class="care-plan-progress-overview__labels
                care-plan-progress-overview__labels--above">
              <div
                class="care-plan-progress-overview__label"
                :class="[
                  `care-plan-progress-overview__label--${
                    currentOverviewLabel.role
                  }`,
                  `care-plan-progress-overview__label--${
                    currentOverviewLabel.tone
                  }`,
                ]"
                :style="overviewLabelStyle(currentOverviewLabel)">
                <p class="text-body2 text-weight-medium q-mb-none">
                  {{ currentOverviewLabel.value }}
                </p>
                <p class="text-caption q-mb-none">
                  {{ currentOverviewLabel.title }}
                </p>
              </div>
            </div>
            <div class="care-plan-progress-overview__track">
              <div
                class="care-plan-progress-overview__fill"
                :style="{ width: `${fillPercent}%` }"
              />
              <div
                v-if="isExceeded"
                class="care-plan-progress-overview__target-mark"
                :style="{ left: `${targetMarkPercent}%` }"
              />
              <div
                v-if="isRegressed"
                class="care-plan-progress-overview__baseline-mark"
                :style="{ left: `${baselineMarkPercent}%` }"
              />
              <div
                v-if="hasCurrentValue && (isNormal || isExceeded)"
                class="care-plan-progress-overview__marker"
                :class="{
                  'care-plan-progress-overview__marker--positive':
                    isExceeded,
                }"
                :style="{ left: `${currentMarkPercent}%` }"
              />
              <div
                v-if="hasCurrentValue && isRegressed"
                class="care-plan-progress-overview__fail"
                :style="{ left: `${currentMarkPercent}%` }"
                :aria-label="t('carePlanMeasurementCurrent')">
                <q-icon name="cancel" size="18px" />
              </div>
            </div>
            <div class="care-plan-progress-overview__labels
              care-plan-progress-overview__labels--below">
              <div
                v-for="label in bottomOverviewLabels"
                :key="label.key"
                class="care-plan-progress-overview__label"
                :class="[
                  `care-plan-progress-overview__label--${label.role}`,
                  `care-plan-progress-overview__label--${label.tone}`,
                ]"
                :style="overviewLabelStyle(label)">
                <p class="text-body2 text-weight-medium q-mb-none">
                  {{ label.value }}
                </p>
                <p class="text-caption q-mb-none">
                  {{ label.title }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <AdminTablePanel
          class="care-plan-history-table-panel admin-table-panel--wide"
          :show-column-settings="false">
          <div
            v-if="historyRows.length"
            class="admin-data-table__scroll">
            <AdminQTable
              class="table admin-data-table admin-data-table--embedded
                admin-data-table--inline-column-settings"
              flat
              hide-bottom
              row-key="id"
              :rows="historyRows"
              :columns="columns"
              :pagination="tablePagination">
              <template #body-cell-measuredDate="scope">
                <q-td
                  :props="scope"
                  class="admin-data-table__secondary-cell">
                  {{ scope.row.measuredDate || '—' }}
                </q-td>
              </template>
              <template #body-cell-value="scope">
                <q-td
                  :props="scope"
                  class="admin-data-table__primary-cell">
                  {{ formatWithUnit(scope.row.value) }}
                </q-td>
              </template>
              <template #body-cell-progress="scope">
                <q-td :props="scope">
                  <span
                    v-if="scope.row.progress?.percent != null"
                    class="care-plan-history-progress"
                    :class="`care-plan-history-progress--${
                      progressTone(scope.row.progress.percent)
                    }`">
                    <span class="care-plan-history-progress__dot" />
                    {{ progressLabel(scope.row.progress.percent) }}
                  </span>
                  <span v-else class="text-grey-6">—</span>
                </q-td>
              </template>
              <template #body-cell-recordedBy="scope">
                <q-td
                  :props="scope"
                  class="admin-data-table__secondary-cell">
                  {{ scope.row.recordedByName || '—' }}
                </q-td>
              </template>
              <template #body-cell-notes="scope">
                <q-td
                  :props="scope"
                  class="admin-data-table__secondary-cell">
                  {{ scope.row.notes || '—' }}
                </q-td>
              </template>
            </AdminQTable>
          </div>
          <div
            v-else
            class="admin-data-table__empty full-width row flex-center
              text-grey-7 q-gutter-sm q-pa-lg">
            <q-icon name="inbox" size="md" />
            <span>{{ t('carePlanMeasurementHistoryEmpty') }}</span>
          </div>
        </AdminTablePanel>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('close')"
          @click="onClose"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminQTable from 'components/AdminQTable.vue'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
import {
  buildOutcomeMeasureHistoryRows,
  measurementProgressTone,
} from 'src/utils/care-plan-orders.js'
import { calculateOutcomeMeasureProgress } from
  'src/utils/care-plan-progress.js'
import { carePlanProgressDirections } from 'components/constants.js'

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

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const tablePagination = { rowsPerPage: 0 }

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

const hasCurrentValue = computed(() => {
  const value = props.measure?.currentValue

  return value != null && value !== ''
})

const progressScale = computed(() =>
  buildProgressScale(props.measure),
)

const scaleMode = computed(() => progressScale.value.mode)

const isExceeded = computed(() => scaleMode.value === 'exceeded')

const isRegressed = computed(() => scaleMode.value === 'regressed')

const isNormal = computed(() => scaleMode.value === 'normal')

const fillPercent = computed(() => progressScale.value.fillPercent)

const currentMarkPercent = computed(
  () => progressScale.value.currentPercent,
)

const targetMarkPercent = computed(
  () => progressScale.value.targetPercent,
)

const baselineMarkPercent = computed(
  () => progressScale.value.baselinePercent,
)

const currentOverviewLabel = computed(() => {
  if (!hasCurrentValue.value) {
    return null
  }
  const percent = currentMarkPercent.value
  const role = labelRoleForPercent(percent)
  if (isRegressed.value) {
    return {
      key: 'current',
      percent,
      value: formatWithUnit(props.measure?.currentValue),
      title: t('carePlanMeasurementCurrent'),
      tone: 'negative',
      role,
    }
  }
  if (isExceeded.value) {
    return {
      key: 'current',
      percent,
      value: formatWithUnit(props.measure?.currentValue),
      title: t('carePlanMeasurementCurrent'),
      tone: 'positive',
      role,
    }
  }

  return {
    key: 'current',
    percent,
    value: formatWithUnit(props.measure?.currentValue),
    title: t('carePlanMeasurementCurrent'),
    tone: 'primary',
    role,
  }
})

const bottomOverviewLabels = computed(() => {
  if (isRegressed.value) {
    const baselinePercent = baselineMarkPercent.value

    return [
      {
        key: 'baseline',
        percent: baselinePercent,
        value: formatWithUnit(props.measure?.baseline),
        title: t('carePlanMeasureBaseline'),
        tone: 'muted',
        role: labelRoleForPercent(baselinePercent),
      },
      {
        key: 'target',
        percent: 100,
        value: formatWithUnit(props.measure?.target),
        title: t('carePlanMeasureTarget'),
        tone: 'muted',
        role: 'end',
      },
    ]
  }
  if (isExceeded.value) {
    const targetPercent = targetMarkPercent.value

    return [
      {
        key: 'baseline',
        percent: 0,
        value: formatWithUnit(props.measure?.baseline),
        title: t('carePlanMeasureBaseline'),
        tone: 'muted',
        role: 'start',
      },
      {
        key: 'target',
        percent: targetPercent,
        value: formatWithUnit(props.measure?.target),
        title: t('carePlanMeasureTarget'),
        tone: 'muted',
        role: labelRoleForPercent(targetPercent),
      },
    ]
  }

  return [
    {
      key: 'baseline',
      percent: 0,
      value: formatWithUnit(props.measure?.baseline),
      title: t('carePlanMeasureBaseline'),
      tone: 'muted',
      role: 'start',
    },
    {
      key: 'target',
      percent: 100,
      value: formatWithUnit(props.measure?.target),
      title: t('carePlanMeasureTarget'),
      tone: 'muted',
      role: 'end',
    },
  ]
})

const historyRows = computed(() =>
  buildOutcomeMeasureHistoryRows(props.measure ?? {}),
)

const columns = computed(() => [
  {
    name: 'measuredDate',
    label: t('carePlanMeasuredDate'),
    align: 'left',
    field: row => row.measuredDate,
    sortable: true,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'value',
    label: t('carePlanMeasurementValue'),
    align: 'left',
    field: row => row.value,
    sortable: true,
    headerStyle: 'min-width: 88px',
    style: 'min-width: 88px',
  },
  {
    name: 'progress',
    label: t('carePlanColProgress'),
    align: 'left',
    field: row => row.progress?.percent,
    sortable: true,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'recordedBy',
    label: t('carePlanRecordedBy'),
    align: 'left',
    field: row => row.recordedByName,
    sortable: true,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'notes',
    label: t('notes'),
    align: 'left',
    field: row => row.notes,
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
])

function formatWithUnit(value) {
  if (value == null || value === '') {
    return '—'
  }
  const unit = unitLabel.value

  return unit ? `${value} ${unit}` : String(value)
}

function overviewLabelStyle(label) {
  return { left: `${label.percent}%` }
}

function labelRoleForPercent(percent) {
  if (percent <= 8) {
    return 'start'
  }
  if (percent >= 92) {
    return 'end'
  }

  return 'mid'
}

function parseScaleNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const num = Number(value)

  return Number.isFinite(num) ? num : null
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, value))
}

const OUT_OF_RANGE_NUDGE_PERCENT = 10

function normalScale(progressPercent) {
  return {
    mode: 'normal',
    fillPercent: progressPercent,
    currentPercent: progressPercent,
    targetPercent: 100,
    baselinePercent: 0,
  }
}

function buildProgressScale(measure) {
  const baseline = parseScaleNumber(measure?.baseline)
  const current = parseScaleNumber(measure?.currentValue)
  const target = parseScaleNumber(measure?.target)
  const direction = measure?.direction
  const progress = calculateOutcomeMeasureProgress(
    baseline,
    current,
    target,
    direction,
  )
  const progressPercent = progress?.percent == null
    ? 0
    : clampPercent(progress.percent)

  if (baseline == null || current == null || target == null) {
    return normalScale(progressPercent)
  }

  const higher = direction === carePlanProgressDirections.higherIsBetter
  const exceeded = higher ? current > target : current < target
  if (exceeded && baseline !== current) {
    return {
      mode: 'exceeded',
      fillPercent: 100,
      currentPercent: 100,
      targetPercent: 100 - OUT_OF_RANGE_NUDGE_PERCENT,
      baselinePercent: 0,
    }
  }

  const regressed = higher ? current < baseline : current > baseline
  if (regressed) {
    return {
      mode: 'regressed',
      fillPercent: 0,
      currentPercent: 0,
      targetPercent: 100,
      baselinePercent: OUT_OF_RANGE_NUDGE_PERCENT,
    }
  }

  return normalScale(progressPercent)
}

function progressTone(percent) {
  return measurementProgressTone(percent)
}

function progressLabel(percent) {
  const tone = measurementProgressTone(percent)
  if (tone === 'baseline') {
    return t('carePlanHistoryProgressBaseline', {
      percent: Math.round(percent),
    })
  }
  if (tone === 'onTrack') {
    return t('carePlanHistoryProgressOnTrack', {
      percent: Math.round(percent),
    })
  }
  if (tone === 'achieved') {
    return t('carePlanHistoryProgressAchieved', {
      percent: Math.round(percent),
    })
  }
  if (tone === 'inProgress') {
    return t('carePlanHistoryProgressInProgress', {
      percent: Math.round(percent),
    })
  }

  return '—'
}

function onClose() {
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

.care-plan-progress-overview {
  position: relative;
  padding: 8px 4px 8px;

  &--has-current {
    padding-top: 4px;
  }

  &__track {
    position: relative;
    height: 4px;
    border-radius: 999px;
    background: #e2e8f0;
  }

  &__fill {
    height: 100%;
    border-radius: 999px;
    background: $primary;
  }

  &--exceeded &__fill {
    background: $positive;
  }

  &--regressed &__track {
    background: rgba($negative, 0.18);
  }

  &__marker {
    position: absolute;
    top: 50%;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: $primary;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px $primary;
    transform: translate(-50%, -50%);

    &--positive {
      background: $positive;
      box-shadow: 0 0 0 1px $positive;
    }
  }

  &__target-mark,
  &__baseline-mark {
    position: absolute;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid $text-muted;
    transform: translate(-50%, -50%);
    z-index: 1;
  }

  &__fail {
    position: absolute;
    top: 50%;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: $negative;
    transform: translate(-50%, -50%);
    pointer-events: none;
    background: #fff;
    border-radius: 50%;
  }

  &__labels {
    position: relative;
    min-height: 44px;

    &--above {
      min-height: 40px;
      margin-bottom: 8px;
    }

    &--below {
      margin-top: 10px;
    }
  }

  &__label {
    position: absolute;
    top: 0;
    white-space: nowrap;

    &--start {
      text-align: left;
    }

    &--mid {
      transform: translateX(-50%);
      text-align: center;
    }

    &--end {
      transform: translateX(-100%);
      text-align: right;
    }

    &--muted .text-caption {
      color: $text-muted;
    }

    &--primary {
      color: $primary;

      .text-caption {
        color: $primary;
      }
    }

    &--positive {
      color: $positive;

      .text-caption {
        color: $positive;
      }
    }

    &--negative {
      color: $negative;

      .text-caption {
        color: $negative;
      }
    }
  }
}

.care-plan-history-progress {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: 600;

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  &--baseline {
    color: #64748b;
  }

  &--inProgress {
    color: #d97706;
  }

  &--onTrack {
    color: #ca8a04;
  }

  &--achieved {
    color: #166534;
  }
}
</style>
