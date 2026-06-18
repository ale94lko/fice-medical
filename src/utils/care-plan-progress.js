import {
  carePlanProgressDirections,
  carePlanProgressStatuses,
} from 'components/constants.js'

function parseNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const num = Number(value)

  return Number.isFinite(num) ? num : null
}

export function calculateOutcomeMeasureProgress(
  baseline,
  current,
  target,
  direction,
) {
  const base = parseNumber(baseline)
  const curr = parseNumber(current)
  const tgt = parseNumber(target)
  if (base == null || curr == null || tgt == null) {
    return { status: carePlanProgressStatuses.notMeasured, percent: null }
  }
  if (base === tgt) {
    const achieved = curr === tgt

    return {
      status: carePlanProgressStatuses.measured,
      percent: achieved ? 100 : 0,
    }
  }

  let percent
  if (direction === carePlanProgressDirections.higherIsBetter) {
    percent = ((curr - base) / (tgt - base)) * 100
  } else {
    percent = ((base - curr) / (base - tgt)) * 100
  }
  percent = Math.max(0, Math.min(100, Math.round(percent * 100) / 100))

  return {
    status: carePlanProgressStatuses.measured,
    percent,
  }
}

export function averageMeasuredProgress(items) {
  const measured = (items ?? []).filter(
    item => item?.progress?.status === carePlanProgressStatuses.measured
      && item.progress.percent != null,
  )
  if (!measured.length) {
    return { status: carePlanProgressStatuses.notMeasured, percent: null }
  }
  const sum = measured.reduce(
    (acc, item) => acc + Number(item.progress.percent),
    0,
  )

  return {
    status: carePlanProgressStatuses.measured,
    percent: Math.round((sum / measured.length) * 100) / 100,
  }
}

export function progressBarColor(percent) {
  if (percent == null) {
    return 'grey'
  }
  if (percent >= 100) {
    return 'positive'
  }
  if (percent >= 50) {
    return 'positive'
  }
  if (percent >= 25) {
    return 'warning'
  }

  return 'negative'
}
