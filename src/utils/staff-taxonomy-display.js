function trim(value) {
  return String(value ?? '').trim()
}

export function taxonomySpecialtyLabel(row = {}) {
  return trim(row.specialization)
    || trim(row.classification)
    || ''
}

export function taxonomySpecialtyTone(label) {
  const value = trim(label).toLowerCase()
  if (!value) {
    return 'neutral'
  }
  if (
    value.includes('cardio')
    || value.includes('heart')
  ) {
    return 'green'
  }
  if (
    value.includes('behav')
    || value.includes('psych')
    || value.includes('mental')
  ) {
    return 'purple'
  }
  if (
    value.includes('family')
    || value.includes('internal')
  ) {
    return 'teal'
  }

  return 'blue'
}

export function taxonomyProviderTypeLabel(grouping, t) {
  const value = trim(grouping).toLowerCase()
  if (!value) {
    return ''
  }
  if (
    value.includes('allopathic')
    || value.includes('osteopathic')
  ) {
    return t('staffTaxonomyTypePhysician')
  }

  return t('staffTaxonomyTypeNonPhysician')
}

export function mergeTaxonomyRowMeta(existing = {}, incoming = {}) {
  return {
    code: trim(incoming.code || existing.code),
    displayName: trim(incoming.displayName || existing.displayName),
    definition: trim(incoming.definition || existing.definition),
    grouping: trim(incoming.grouping || existing.grouping),
    classification: trim(
      incoming.classification || existing.classification,
    ),
    specialization: trim(
      incoming.specialization || existing.specialization,
    ),
    isPrimary: Boolean(
      incoming.isPrimary ?? existing.isPrimary,
    ),
  }
}

export function ensureSinglePrimaryTaxonomy(rows = []) {
  const list = (rows ?? []).map(row => ({ ...row }))
  if (!list.length) {
    return list
  }
  const primaryIndex = list.findIndex(row => row.isPrimary)
  if (primaryIndex < 0) {
    list[0].isPrimary = true
    return list
  }
  list.forEach((row, index) => {
    row.isPrimary = index === primaryIndex
  })

  return list
}
