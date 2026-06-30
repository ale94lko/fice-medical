import {
  getCalendarEventMinuteRange,
} from 'src/utils/calendar-events.js'
import { resolveTenantTimeZone } from 'src/utils/appointment-datetime.js'

const cascadeStepPercent = 14
const frontLayerExtraPercent = 6
const baseInsetPercent = 2
const baseWidthPercent = 96

function eventDurationMinutes(item) {
  return item.end - item.start
}

function assignDepthRanks(cluster) {
  const ranked = [...cluster].sort(
    (a, b) => eventDurationMinutes(a) - eventDurationMinutes(b),
  )

  ranked.forEach((item, index) => {
    item.depthRank = index
  })
}

function depthLayoutMeta(item, clusterSize) {
  const depthRank = item.depthRank ?? 0
  const longestRank = Math.max(clusterSize - 1, 0)

  return {
    zIndex: clusterSize - depthRank,
    layer: clusterSize > 1 && depthRank < longestRank,
    depthRank,
    clusterSize,
  }
}

function sortForLayout(a, b) {
  if (a.start !== b.start) {
    return a.start - b.start
  }

  return eventDurationMinutes(b) - eventDurationMinutes(a)
}

function splitOverlapClusters(items) {
  const sorted = [...items].sort(sortForLayout)
  const clusters = []
  let current = []
  let clusterEnd = -1

  for (const item of sorted) {
    if (!current.length || item.start < clusterEnd) {
      current.push(item)
      clusterEnd = Math.max(clusterEnd, item.end)
      continue
    }

    clusters.push(current)
    current = [item]
    clusterEnd = item.end
  }

  if (current.length) {
    clusters.push(current)
  }

  return clusters
}

function buildAlignedBackLayout(depthMeta) {
  return {
    left: '4px',
    right: '4px',
    zIndex: depthMeta.zIndex,
    layer: false,
    depthRank: depthMeta.depthRank,
    clusterSize: depthMeta.clusterSize,
  }
}

function buildCascadeLayout(depthMeta) {
  const longestRank = Math.max(depthMeta.clusterSize - 1, 0)

  if (depthMeta.depthRank === longestRank) {
    return buildAlignedBackLayout(depthMeta)
  }

  const stepsFromBack = longestRank - depthMeta.depthRank
  const frontBoost = depthMeta.depthRank === 0
    ? frontLayerExtraPercent
    : 0
  const leftPercent = baseInsetPercent
    + stepsFromBack * cascadeStepPercent
    + frontBoost
  const widthPercent = Math.max(
    34,
    baseWidthPercent - stepsFromBack * cascadeStepPercent - frontBoost,
  )

  return {
    left: `calc(${leftPercent}% + 4px)`,
    width: `calc(${widthPercent}% - 8px)`,
    right: 'auto',
    zIndex: depthMeta.zIndex,
    layer: true,
    depthRank: depthMeta.depthRank,
    clusterSize: depthMeta.clusterSize,
  }
}

function buildSingleLayout() {
  return {
    left: '4px',
    right: '4px',
    zIndex: 1,
    layer: false,
    depthRank: 0,
    clusterSize: 1,
  }
}

function layoutCluster(cluster) {
  assignDepthRanks(cluster)
  const clusterSize = cluster.length
  const layouts = new Map()

  if (clusterSize <= 1) {
    for (const item of cluster) {
      layouts.set(item.event.id, buildSingleLayout())
    }

    return layouts
  }

  for (const item of cluster) {
    const depthMeta = depthLayoutMeta(item, clusterSize)
    layouts.set(item.event.id, buildCascadeLayout(depthMeta))
  }

  return layouts
}

export function layoutOverlappingDayEvents(
  events,
  timeZone = resolveTenantTimeZone(),
) {
  const items = (events ?? []).map(event => {
    const range = getCalendarEventMinuteRange(event, timeZone)

    return {
      event,
      start: range.start,
      end: range.end,
    }
  })
  const layouts = new Map()

  for (const cluster of splitOverlapClusters(items)) {
    const clusterLayouts = layoutCluster(cluster)
    clusterLayouts.forEach((layout, eventId) => {
      layouts.set(eventId, layout)
    })
  }

  return layouts
}
