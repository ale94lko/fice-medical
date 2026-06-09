/**
 * Primary: confidence HIGH → MEDIUM → LOW (and ES synonyms).
 * Within tier: newer match → active patient → last client update → score → id.
 * Missing API fields sort as 0 / unknown-active so behavior stays stable.
 */

function confidenceRank(confidence) {
  const u = String(confidence ?? '').trim().toUpperCase().replace(/\s+/g, '_')
  if (u === 'HIGH' || u === 'ALTA') {
    return 0
  }
  if (u === 'MEDIUM' || u === 'MEDIA') {
    return 1
  }
  if (u === 'LOW' || u === 'BAJA') {
    return 2
  }

  return 3
}

/** Higher = sort earlier (active / unknown preferred over inactive). */
function patientActiveSortKey(match) {
  const v = match?.patientIsActive
  if (v === false) {
    return 0
  }
  if (v === true) {
    return 2
  }

  return 1
}

function compareWithinConfidenceTier(a, b) {
  const recency = (b.matchRecordedAtMs ?? 0) - (a.matchRecordedAtMs ?? 0)
  if (recency !== 0) {
    return recency
  }
  const active = patientActiveSortKey(b) - patientActiveSortKey(a)
  if (active !== 0) {
    return active
  }
  const updated =
    (b.clientLastUpdatedAtMs ?? 0) - (a.clientLastUpdatedAtMs ?? 0)
  if (updated !== 0) {
    return updated
  }
  const score = (b.matchScore ?? 0) - (a.matchScore ?? 0)
  if (score !== 0) {
    return score
  }

  return (b.patientId ?? 0) - (a.patientId ?? 0)
}

export function sortDuplicateMatches(matches) {
  const list = Array.isArray(matches) ? [...matches] : []
  list.sort((a, b) => {
    const tier = confidenceRank(a.matchConfidence)
      - confidenceRank(b.matchConfidence)
    if (tier !== 0) {
      return tier
    }

    return compareWithinConfidenceTier(a, b)
  })

  return list
}
