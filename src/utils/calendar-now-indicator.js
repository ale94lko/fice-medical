import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { calendarTimeRowHeightPx } from 'src/constants/calendar.js'
import { resolveTenantTimeZone } from 'src/utils/appointment-datetime.js'

function resolveTimeZone(timeZone) {
  const raw = typeof timeZone === 'function' ? timeZone() : timeZone

  return String(raw ?? '').trim() || resolveTenantTimeZone()
}

export function localMinutesNow(timeZone = resolveTenantTimeZone()) {
  const tz = resolveTimeZone(timeZone)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0)

  return hour * 60 + minute
}

export function nowIndicatorTopPx(timeZone = resolveTenantTimeZone()) {
  return (localMinutesNow(timeZone) / 60) * calendarTimeRowHeightPx
}

export function scrollContainerToNow(containerEl, nowTopPx) {
  if (!containerEl || !Number.isFinite(nowTopPx)) {
    return
  }

  const target = nowTopPx - containerEl.clientHeight / 2
  containerEl.scrollTop = Math.max(0, target)
}

export function useCalendarNowIndicator(timeZone) {
  const nowTick = ref(Date.now())
  let timer = null

  onMounted(() => {
    timer = window.setInterval(() => {
      nowTick.value = Date.now()
    }, 60_000)
  })

  onUnmounted(() => {
    if (timer) {
      window.clearInterval(timer)
    }
  })

  const nowLineStyle = computed(() => {
    void nowTick.value

    return {
      top: `${nowIndicatorTopPx(resolveTimeZone(timeZone))}px`,
    }
  })

  const nowScrollTopPx = computed(() => {
    void nowTick.value

    return nowIndicatorTopPx(resolveTimeZone(timeZone))
  })

  return {
    nowLineStyle,
    nowScrollTopPx,
  }
}

export function useCalendarScrollToNow(
  bodyRef,
  nowScrollTopPx,
  { enabled = () => true, scrollToNowKey = null } = {},
) {
  function scrollToNow() {
    if (!enabled()) {
      return
    }

    scrollContainerToNow(bodyRef.value, nowScrollTopPx.value)
  }

  onMounted(() => {
    void nextTick(() => {
      scrollToNow()
    })
  })

  if (scrollToNowKey) {
    watch(scrollToNowKey, () => {
      void nextTick(() => {
        scrollToNow()
      })
    })
  }
}
