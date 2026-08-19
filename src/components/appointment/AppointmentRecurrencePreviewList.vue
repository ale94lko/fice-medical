<template>
  <div
    class="recurrence-preview q-mt-md"
    :data-testid="appointmentTestIds.recurrencePreview">
    <div
      class="recurrence-preview__frame"
      :class="{
        'recurrence-preview__frame--empty':
          loading && !modelValue.length,
      }">
      <div class="recurrence-preview__grid">
        <div
          v-for="row in modelValue"
          :key="row.index"
          class="recurrence-preview__card"
          :class="{
            'recurrence-preview__card--warn':
              isPreviewRowFlagged(row),
          }"
          :data-testid="
            appointmentTestIds.recurrencePreviewRow(row.index)
          ">
          <span
            class="recurrence-preview__status"
            :class="statusClass(row)">
            <q-icon
              :name="isPreviewRowFlagged(row)
                ? 'priority_high'
                : 'check'"
              size="14px"
            />
            <q-tooltip v-if="adjustmentLabel(row)">
              {{ adjustmentLabel(row) }}
            </q-tooltip>
          </span>
          <span
            class="recurrence-preview__when"
            :data-testid="appointmentTestIds.field(
              `recurrence-when-${row.index}`,
            )">
            {{ cardHeading(row) }}
          </span>
        </div>
      </div>
      <div
        v-if="loading"
        class="recurrence-preview__overlay"
        role="status"
        :aria-label="t('appointmentRecurrenceCalculating')">
        <q-spinner color="primary" size="22px" />
        <span>{{ t('appointmentRecurrenceCalculating') }}</span>
      </div>
    </div>
    <p
      v-if="failed && !loading"
      class="form-field__error q-mt-sm">
      {{ t('appointmentRecurrencePreviewError') }}
    </p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { appointmentTestIds } from 'src/test-ids'
import { formatUtcTime }
  from 'src/utils/appointment-datetime.js'
import {
  isPreviewRowFlagged,
  rebuildProposedStart,
  weekdayI18nKeyFromUsDate,
} from 'src/utils/recurrence-preview.js'

defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  failed: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

function cardHeading(row) {
  const weekdayKey = weekdayI18nKeyFromUsDate(row.dateUs)
  const weekday = weekdayKey ? t(weekdayKey) : ''
  const date = String(row.dateUs ?? '').trim()
  const time = formatUtcTime(
    rebuildProposedStart(row) || row.proposedStartAtUtc,
  )

  return [date, weekday, time].filter(Boolean).join(' ')
}

function statusClass(row) {
  return isPreviewRowFlagged(row)
    ? 'recurrence-preview__status--warn'
    : 'recurrence-preview__status--ok'
}

function adjustmentLabel(row) {
  if (row.userEdited) {
    return ''
  }
  if (row.adjustment === 'same_day') {
    return t('appointmentRecurrenceAdjustmentSameDay')
  }
  if (row.adjustment === 'next_day') {
    return t('appointmentRecurrenceAdjustmentNextDay')
  }
  if (row.adjustment === 'unavailable') {
    return t('appointmentRecurrenceAdjustmentUnavailable')
  }

  return ''
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.recurrence-preview__frame {
  position: relative;
}

.recurrence-preview__frame--empty .recurrence-preview__grid {
  min-height: 8.75rem;
}

.recurrence-preview__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  max-height: 8.75rem;
  overflow-y: auto;
  min-height: 2.5rem;
}

.recurrence-preview__card {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  min-height: 36px;
  padding: 4px 8px;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface;
}

.recurrence-preview__card--warn {
  background: #fef6e6;
  border-color: $warning;
}

.recurrence-preview__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  color: $white;
}

.recurrence-preview__status--warn {
  background: $warning;
}

.recurrence-preview__status--ok {
  background: $positive;
}

.recurrence-preview__when {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: $text-strong;
  font-size: 0.75rem;
  font-weight: 700;
}

.recurrence-preview__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: $radius-md;
  background: rgba($surface, 0.78);
  color: $text-strong;
  font-size: 0.8125rem;
  font-weight: 600;
}
</style>
