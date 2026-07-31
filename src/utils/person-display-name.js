import {
  findCatalogSelectOption,
  resolveCatalogOptionLabel,
} from 'src/utils/catalogs.js'

function trim(value) {
  return String(value ?? '').trim()
}

/**
 * Canonical person name: "Mr. First Middle Last, III"
 * Prefix/suffix use catalog labels when options are provided.
 */
export function formatPersonDisplayName(
  {
    prefix = '',
    firstName = '',
    middleName = '',
    lastName = '',
    suffix = '',
  } = {},
  {
    prefixSelectOptions = [],
    suffixSelectOptions = [],
  } = {},
) {
  const core = [firstName, middleName, lastName]
    .map(trim)
    .filter(Boolean)
    .join(' ')
  if (!core) {
    return ''
  }

  const prefixLabel = resolveCatalogOptionLabel(
    prefixSelectOptions,
    prefix,
  )
  const suffixLabel = resolveCatalogOptionLabel(
    suffixSelectOptions,
    suffix,
  )

  let result = suffixLabel ? `${core}, ${suffixLabel}` : core
  if (prefixLabel) {
    result = `${prefixLabel} ${result}`
  }

  return result
}

/**
 * Read common API / form name parts from a loose object.
 * Prefers non-empty values (avoids null/"" from nested personal wiping
 * a top-level prefix/suffix).
 */
export function personNamePartsFromRecord(record = {}) {
  const personal = record?.personal_information
    ?? record?.personalInformation
    ?? record?.basic_info
    ?? record?.basicInfo
    ?? null

  return {
    prefix: coalescePart(
      record?.prefix,
      personal?.prefix,
    ),
    firstName: coalescePart(
      record?.first_name,
      record?.firstName,
      personal?.first_name,
      personal?.firstName,
    ),
    middleName: coalescePart(
      record?.middle_name,
      record?.middleName,
      personal?.middle_name,
      personal?.middleName,
    ),
    lastName: coalescePart(
      record?.last_name,
      record?.lastName,
      personal?.last_name,
      personal?.lastName,
    ),
    suffix: coalescePart(
      record?.suffix,
      personal?.suffix,
    ),
  }
}

function coalescePart(...values) {
  for (const value of values) {
    const text = trim(value)
    if (text) {
      return text
    }
  }

  return ''
}

function resolveTrailingListSuffix(name, suffix, suffixSelectOptions) {
  const explicitSuffix = trim(suffix)
  const commaMatch = name.match(/^(.+),\s*([^,]+)$/)
  if (commaMatch) {
    const head = commaMatch[1].trim()
    const tail = commaMatch[2].trim()
    const suffixOption = findCatalogSelectOption(
      suffixSelectOptions,
      tail || explicitSuffix,
    )
    if (suffixOption?.label) {
      return `${head}, ${suffixOption.label}`
    }

    return name
  }

  const tokens = name.split(/\s+/).filter(Boolean)
  if (tokens.length < 2) {
    return name
  }

  const lastToken = tokens[tokens.length - 1]
  const suffixOption = findCatalogSelectOption(
    suffixSelectOptions,
    lastToken || explicitSuffix,
  )
  if (suffixOption?.label) {
    tokens[tokens.length - 1] = suffixOption.label

    return tokens.join(' ')
  }

  if (!explicitSuffix) {
    return name
  }

  const fromField = findCatalogSelectOption(
    suffixSelectOptions,
    explicitSuffix,
  )
  if (fromField?.label) {
    return `${name}, ${fromField.label}`
  }

  return name
}

function applyListPrefix(name, prefix, prefixSelectOptions) {
  const result = trim(name)
  if (!result) {
    return ''
  }

  const firstToken = result.split(/\s+/).filter(Boolean)[0] ?? ''
  const leadingOption = findCatalogSelectOption(
    prefixSelectOptions,
    firstToken,
  )
  if (leadingOption?.label) {
    const rest = result.slice(firstToken.length).trim()

    return rest ? `${leadingOption.label} ${rest}` : leadingOption.label
  }

  const explicitPrefix = trim(prefix)
  if (!explicitPrefix) {
    return result
  }

  const prefixLabel = resolveCatalogOptionLabel(
    prefixSelectOptions,
    explicitPrefix,
  ) || explicitPrefix

  return prefixLabel ? `${prefixLabel} ${result}` : result
}

/**
 * Prefer structured parts; otherwise clean a prebuilt name string.
 * Always re-applies prefix when the cleaned name does not already start
 * with a known catalog prefix.
 */
export function formatPersonDisplayNameFromRecord(
  record,
  catalogOptions = {},
  prebuiltName = '',
) {
  const parts = personNamePartsFromRecord(record ?? {})
  const suffixFromName = extractSuffixFromDisplayName(prebuiltName)
  const partsWithSuffix = {
    ...parts,
    suffix: parts.suffix || suffixFromName,
  }

  const fromParts = formatPersonDisplayName(partsWithSuffix, catalogOptions)
  if (fromParts) {
    return fromParts
  }

  const rawName = trim(
    prebuiltName
    || record?.name
    || record?.full_name
    || record?.fullName
    || record?.display_name
    || record?.displayName,
  )
  if (!rawName) {
    return formatPersonDisplayName(partsWithSuffix, catalogOptions)
  }

  const withSuffix = resolveTrailingListSuffix(
    rawName,
    partsWithSuffix.suffix,
    catalogOptions.suffixSelectOptions ?? [],
  )

  return applyListPrefix(
    withSuffix,
    partsWithSuffix.prefix,
    catalogOptions.prefixSelectOptions ?? [],
  )
}

function extractSuffixFromDisplayName(name) {
  const text = trim(name)
  const commaMatch = text.match(/^(.+),\s*([^,]+)$/)
  if (!commaMatch) {
    return ''
  }

  return trim(commaMatch[2])
}
