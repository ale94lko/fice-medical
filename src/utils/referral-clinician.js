function trim(value) {
  return String(value ?? '').trim()
}

function normalizeName(value) {
  return trim(value).toLowerCase()
}

function optionNames(option) {
  return [
    option?.name,
    option?.label,
    option?.personName,
  ]
    .map(trim)
    .filter(Boolean)
}

export function matchClinicianOptionByName(name, options = []) {
  const needle = normalizeName(name)
  if (!needle) {
    return null
  }
  const list = Array.isArray(options) ? options : []
  const exact = list.find(option =>
    optionNames(option).some(label => normalizeName(label) === needle),
  )
  if (exact) {
    return exact
  }

  return list.find(option => {
    const person = normalizeName(option?.name || option?.personName)
    if (person && needle.startsWith(person)) {
      return true
    }
    const label = normalizeName(option?.label)
    if (!label) {
      return false
    }

    return needle.startsWith(label.split(' - ')[0])
      || label.startsWith(needle)
  }) ?? null
}

export function specialtyFromClinicianName(name, options = []) {
  return trim(matchClinicianOptionByName(name, options)?.specialty)
}

export function isSystemClinicianName(name, options = []) {
  return Boolean(matchClinicianOptionByName(name, options))
}

export function clinicianSelectLabels(options = []) {
  return (Array.isArray(options) ? options : [])
    .map(option => String(option.label ?? option.name ?? '').trim())
    .filter(Boolean)
}

export function specialtyAfterProviderChange(
  nextName,
  previousName,
  options = [],
  currentSpecialty = '',
) {
  if (isSystemClinicianName(nextName, options)) {
    return specialtyFromClinicianName(nextName, options) || ''
  }
  if (
    previousName != null
    && trim(previousName)
    && isSystemClinicianName(previousName, options)
  ) {
    return ''
  }

  return trim(currentSpecialty)
}
