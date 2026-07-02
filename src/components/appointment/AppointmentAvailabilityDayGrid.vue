<template>
  <div class="appointment-availability-day-grid calendar-day-view">
    <div
      ref="bodyRef"
      class="appointment-availability-day-grid__body
        calendar-day-view__body row no-wrap">
      <div class="calendar-day-view__hours">
        <div
          v-for="hour in hourLabels"
          :key="hour.hour"
          class="calendar-day-view__hour-label">
          {{ hour.label }}
        </div>
      </div>

      <div class="col calendar-day-view__grid-wrap">
        <div
          ref="gridRef"
          class="calendar-day-view__grid
            appointment-availability-day-grid__grid"
          :class="{
            'appointment-availability-day-grid__grid--interactive': !readonly,
          }"
          @click="onGridClick">
          <div
            v-for="hour in hourLabels"
            :key="hour.hour"
            class="calendar-day-view__hour-line"
          />
          <CalendarNowLine
            :line-style="nowLineStyle"
            :visible="dayKey === todayKey"
          />
          <div
            v-for="(block, index) in dayBlocks"
            :key="blockKey(block, index)"
            class="appointment-availability-day-grid__block"
            :class="blockClass(block)"
            :style="blockStyle(block)"
            :title="blockTitle(block)"
            @click.stop="onBlockClick(block)"
          >
            <span
              v-if="isAppointmentBlock(block)"
              class="appointment-availability-day-grid__block-label">
              {{ blockLabel(block) }}
            </span>
          </div>
          <div
            v-if="selectionStyle"
            class="appointment-availability-day-grid__selection"
            :class="{
              'appointment-availability-day-grid__selection--dragging':
                dragging,
            }"
            :style="selectionStyle"
            @pointerdown.stop="onSelectionPointerDown"
          />
        </div>
      </div>
    </div>
    <AppointmentDetailDialog
      v-model="appointmentDetailOpen"
      :record="appointmentDetailRecord"
    />
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import AppointmentDetailDialog from 'components/AppointmentDetailDialog.vue'
import CalendarNowLine from 'components/calendar/CalendarNowLine.vue'
import {
  appointmentAvailabilityBlockTypes,
} from 'components/constants.js'
import {
  calendarHourEnd,
  calendarHourStart,
  calendarTimeRowHeightPx,
} from 'src/constants/calendar.js'
import { buildHourLabels } from 'src/utils/calendar-grid.js'
import {
  calendarBlockToAppointmentRecord,
  calendarBlocksForDay,
  computeMinuteSegmentStyle,
  computeSelectedAppointmentStyle,
  formatOccupiedSegmentTitle,
  resolveAvailabilityScrollFocusMinute,
  scrollContainerToMinute,
  windowMatchesDay,
} from 'src/utils/appointment-availability-ranges.js'
import {
  todayLocalDayKey,
} from 'src/utils/appointment-datetime.js'
import { useCalendarNowIndicator } from 'src/utils/calendar-now-indicator.js'

const props = defineProps({
  dayKey: { type: String, default: '' },
  ranges: { type: Array, default: () => [] },
  blocks: { type: Array, default: () => [] },
  selectedWindow: { type: Object, default: null },
  durationMinutes: { type: Number, default: null },
  timeZone: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['select-time'])

const { t } = useI18n()
const bodyRef = ref(null)
const gridRef = ref(null)
const dragging = ref(false)
const appointmentDetailOpen = ref(false)
const appointmentDetailRecord = ref(null)

const hourLabels = buildHourLabels(calendarHourStart, calendarHourEnd)
const todayKey = computed(() => todayLocalDayKey(props.timeZone))
const { nowLineStyle } = useCalendarNowIndicator(() => props.timeZone)

const dayBlocks = computed(() =>
  calendarBlocksForDay(props.blocks, props.dayKey, props.timeZone),
)

const selectionStyle = computed(() => {
  if (
    !props.selectedWindow
    || !windowMatchesDay(props.selectedWindow, props.dayKey, props.timeZone)
  ) {
    return null
  }

  return computeSelectedAppointmentStyle(
    props.selectedWindow,
    props.durationMinutes,
    props.timeZone,
  )
})

function blockKey(block, index) {
  return [
    block.blockType,
    block.startAtUtc,
    block.endAtUtc,
    index,
  ].join('|')
}

function isAppointmentBlock(block) {
  return block.blockType === appointmentAvailabilityBlockTypes.appointment
}

function blockClass(block) {
  return `appointment-availability-day-grid__block--${block.blockType}`
}

function blockStyle(block) {
  return computeMinuteSegmentStyle(block.span)
}

function blockTitle(block) {
  const time = formatOccupiedSegmentTitle(block.span.start, block.span.end)

  if (isAppointmentBlock(block)) {
    const client = String(block.clientDisplayName ?? '').trim()
    const services = String(block.servicesLabel ?? '').trim()
    if (client && services) {
      return t('appointmentAvailabilityBookedBlockDetail', {
        time,
        client,
        services,
      })
    }
    if (client) {
      return t('appointmentAvailabilityBookedBlockClient', { time, client })
    }

    return t('appointmentAvailabilityBookedBlock', { time })
  }

  if (block.blockType === appointmentAvailabilityBlockTypes.break) {
    return t('appointmentAvailabilityBreakBlock', { time })
  }

  return t('appointmentAvailabilityOutsideHoursBlock', { time })
}

function blockLabel(block) {
  const client = String(block.clientDisplayName ?? '').trim()
  if (client) {
    return client
  }

  return String(block.servicesLabel ?? block.label ?? '').trim()
}

function onBlockClick(block) {
  if (!isAppointmentBlock(block)) {
    return
  }

  appointmentDetailRecord.value = calendarBlockToAppointmentRecord(block)
  appointmentDetailOpen.value = true
}

function emitTimeFromOffsetY(offsetY) {
  emit('select-time', { dayKey: props.dayKey, offsetY })
}

function onGridClick(event) {
  if (props.readonly) {
    return
  }

  const grid = gridRef.value
  if (!grid?.getBoundingClientRect) {
    return
  }

  const rect = grid.getBoundingClientRect()
  const offsetY = event.clientY - rect.top
  emitTimeFromOffsetY(offsetY)
}

function onSelectionPointerDown(event) {
  if (props.readonly || !props.selectedWindow) {
    return
  }

  const grid = gridRef.value
  const selectionEl = event.currentTarget
  if (!grid?.getBoundingClientRect || !selectionEl?.getBoundingClientRect) {
    return
  }

  event.preventDefault()
  dragging.value = true

  const grabOffsetY = event.clientY
    - selectionEl.getBoundingClientRect().top
  const hourCount = calendarHourEnd - calendarHourStart + 1
  const maxOffsetY = hourCount * calendarTimeRowHeightPx

  function onPointerMove(moveEvent) {
    const gridRect = grid.getBoundingClientRect()
    const offsetY = Math.max(
      0,
      Math.min(
        moveEvent.clientY - gridRect.top - grabOffsetY,
        maxOffsetY,
      ),
    )
    emitTimeFromOffsetY(offsetY)
  }

  function onPointerUp() {
    dragging.value = false
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function scrollToFocus() {
  const minute = resolveAvailabilityScrollFocusMinute(
    props.ranges,
    props.dayKey,
    props.durationMinutes,
    props.timeZone,
  )

  scrollContainerToMinute(bodyRef.value, minute)
}

watch(
  () => [props.dayKey, props.ranges, props.durationMinutes],
  () => {
    void nextTick(() => {
      scrollToFocus()
    })
  },
)

onMounted(() => {
  void nextTick(() => {
    scrollToFocus()
  })
})
</script>
