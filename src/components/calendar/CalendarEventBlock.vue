<template>
  <button
    ref="rootRef"
    type="button"
    class="calendar-event"
    :class="[
      event.statusClass,
      {
        'calendar-event--overlap-layer': overlapLayout?.layer,
        'calendar-event--overlap-front': overlapLayout?.depthRank === 0
          && (overlapLayout?.clusterSize ?? 0) > 1,
        'calendar-event--fits': labelFits,
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
    <span
      ref="labelRef"
      class="calendar-event__label">
      {{ event.clientLabel || event.typeLabel }}
    </span>
  </button>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

const labelRef = ref(null)
const rootRef = ref(null)
const labelFits = ref(false)
let resizeObserver = null

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

function measureLabelFit() {
  const el = labelRef.value
  const root = rootRef.value
  if (!el || !root) {
    labelFits.value = false

    return
  }
  const styles = getComputedStyle(root)
  const padX = (parseFloat(styles.paddingLeft) || 0)
    + (parseFloat(styles.paddingRight) || 0)
  const available = root.clientWidth - padX
  labelFits.value = el.scrollWidth <= available + 1
}

function scheduleMeasure() {
  nextTick(() => {
    measureLabelFit()
  })
}

onMounted(() => {
  scheduleMeasure()
  if (typeof ResizeObserver === 'undefined') {
    return
  }
  resizeObserver = new ResizeObserver(() => {
    measureLabelFit()
  })
  if (rootRef.value) {
    resizeObserver.observe(rootRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

watch(
  () => [
    props.event?.clientLabel,
    props.event?.typeLabel,
    props.event?.timeLabel,
    props.overlapLayout?.left,
    props.overlapLayout?.width,
    props.overlapLayout?.right,
    positionStyle.value?.width,
    positionStyle.value?.height,
  ],
  () => {
    scheduleMeasure()
  },
)
</script>
