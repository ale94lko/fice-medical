<template>
  <button
    type="button"
    class="calendar-event"
    :class="[
      event.statusClass,
      {
        'calendar-event--overlap-layer': overlapLayout?.layer,
        'calendar-event--overlap-front': overlapLayout?.depthRank === 0
          && (overlapLayout?.clusterSize ?? 0) > 1,
      },
    ]"
    :data-testid="calendarTestIds.event(event.id)"
    :style="positionStyle"
    @click.stop="emit('select', event)">
    <span
      v-if="event.timeLabel"
      class="calendar-event__time">
      {{ event.timeLabel }}
    </span>
    <span class="calendar-event__label">{{ event.typeLabel }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { computeCalendarEventPositionStyle } from
  'src/utils/calendar-events.js'
import { resolveTenantTimeZone } from 'src/utils/appointment-datetime.js'
import { calendarTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  event: { type: Object, required: true },
  timeZone: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  overlapLayout: { type: Object, default: null },
})

const emit = defineEmits(['select'])

const positionStyle = computed(() => {
  if (props.compact) {
    return props.event.colorStyle ?? {}
  }

  const tz = props.timeZone || resolveTenantTimeZone()
  const base = computeCalendarEventPositionStyle(
    props.event.startAtUtc,
    props.event.endAtUtc,
    tz,
    props.event.durationMin ?? props.event.appointment?.durationMin,
  )
  const overlap = props.overlapLayout ?? {
    left: '4px',
    right: '4px',
    zIndex: 1,
  }

  return {
    ...base,
    left: overlap.left,
    width: overlap.width,
    right: overlap.right,
    zIndex: overlap.zIndex,
    ...(props.event.colorStyle ?? {}),
  }
})
</script>
