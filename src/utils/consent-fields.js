export const consentFieldTypeValues = {
  text: 'TEXT',
  textarea: 'TEXTAREA',
  date: 'DATE',
  select: 'SELECT',
  checkbox: 'CHECKBOX',
  multiSelect: 'MULTI_SELECT',
}

export const consentFieldPrefillValues = {
  manual: 'MANUAL',
  clientData: 'CLIENT_DATA',
  userData: 'USER_DATA',
}

export function consentFieldTypeOptions(t) {
  return [
    {
      value: consentFieldTypeValues.text,
      label: t('consentFieldTypeText'),
    },
    {
      value: consentFieldTypeValues.textarea,
      label: t('consentFieldTypeTextarea'),
    },
    {
      value: consentFieldTypeValues.date,
      label: t('consentFieldTypeDate'),
    },
    {
      value: consentFieldTypeValues.select,
      label: t('consentFieldTypeSelect'),
    },
    {
      value: consentFieldTypeValues.checkbox,
      label: t('consentFieldTypeCheckbox'),
    },
    {
      value: consentFieldTypeValues.multiSelect,
      label: t('consentFieldTypeMultiSelect'),
    },
  ]
}

export function consentFieldPrefillOptions(t) {
  return [
    {
      value: consentFieldPrefillValues.manual,
      label: t('consentFieldPrefillManual'),
    },
    {
      value: consentFieldPrefillValues.clientData,
      label: t('consentFieldPrefillClient'),
    },
    {
      value: consentFieldPrefillValues.userData,
      label: t('consentFieldPrefillStaff'),
    },
  ]
}

export function emptyConsentFieldDefinition(order = 0) {
  return {
    key: '',
    label: '',
    fieldType: consentFieldTypeValues.text,
    required: false,
    displayOrder: order,
    options: [],
    placeholder: '',
    helpText: '',
    active: true,
    prefillSource: consentFieldPrefillValues.manual,
    prefillKey: '',
    readOnly: false,
    includeInDocument: true,
    requiredWhenField: '',
    requiredWhenValue: '',
  }
}

export function slugConsentFieldKey(raw) {
  return String(raw ?? '')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80)
}

export function normalizeConsentFieldOption(raw) {
  if (raw == null) {
    return null
  }
  if (typeof raw === 'string') {
    return optionFromLine(raw)
  }
  const label = String(raw.label ?? raw.name ?? raw.text ?? '').trim()
  const value = String(raw.value ?? raw.key ?? '').trim()
    || slugConsentFieldKey(label)
  if (!label && !value) {
    return null
  }
  const completionStatus = String(
    raw.completion_status ?? raw.completionStatus ?? '',
  ).trim().toUpperCase()
  const option = { value: value || label, label: label || value }
  if (completionStatus === 'DECLINED' || completionStatus === 'ACCEPTED') {
    option.completionStatus = completionStatus
  }

  return option
}

function optionFromLine(raw) {
  const token = String(raw ?? '').trim()
  if (!token) {
    return null
  }
  const match = /^(.*?)\s*\|\s*(DECLINED|ACCEPTED)\s*$/i.exec(token)
  if (match) {
    const option = normalizeConsentFieldOption(match[1])
    if (!option) {
      return null
    }
    option.completionStatus = match[2].toUpperCase()

    return option
  }
  const label = token

  return { value: slugConsentFieldKey(label) || label, label }
}

export function normalizeConsentFieldDefinition(raw = {}, index = 0) {
  const row = raw ?? {}
  const options = Array.isArray(row.options)
    ? row.options.map(normalizeConsentFieldOption).filter(Boolean)
    : []

  return {
    id: row.id ?? null,
    key: String(row.key ?? '').trim(),
    label: String(row.label ?? '').trim(),
    fieldType: String(row.field_type ?? row.fieldType ?? 'TEXT')
      .trim()
      .toUpperCase() || consentFieldTypeValues.text,
    required: Boolean(row.required),
    displayOrder: Number.isFinite(Number(row.display_order
      ?? row.displayOrder))
      ? Number(row.display_order ?? row.displayOrder)
      : index,
    options,
    placeholder: String(row.placeholder ?? '').trim(),
    helpText: String(row.help_text ?? row.helpText ?? '').trim(),
    active: row.active !== false,
    prefillSource: String(
      row.prefill_source ?? row.prefillSource ?? 'MANUAL',
    ).trim().toUpperCase() || consentFieldPrefillValues.manual,
    prefillKey: String(row.prefill_key ?? row.prefillKey ?? '').trim(),
    readOnly: Boolean(row.read_only ?? row.readOnly),
    includeInDocument: (row.include_in_document
      ?? row.includeInDocument) !== false,
    requiredWhenField: String(
      row.required_when_field ?? row.requiredWhenField ?? '',
    ).trim(),
    requiredWhenValue: String(
      row.required_when_value ?? row.requiredWhenValue ?? '',
    ).trim(),
  }
}

export function isoDateToUs(value) {
  const token = String(value ?? '').trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(token)
  if (!match) {
    return token
  }

  return `${match[2]}/${match[3]}/${match[1]}`
}

export function emptyValueForConsentField(fieldType) {
  if (fieldType === consentFieldTypeValues.multiSelect) {
    return []
  }
  if (fieldType === consentFieldTypeValues.checkbox) {
    return false
  }

  return ''
}

export function normalizeConsentFieldValue(raw = {}, index = 0) {
  const definition = normalizeConsentFieldDefinition(raw, index)
  let value = raw.value
  if (definition.fieldType === consentFieldTypeValues.multiSelect) {
    value = Array.isArray(value) ? value : []
  } else if (definition.fieldType === consentFieldTypeValues.checkbox) {
    value = value === true || value === 'true'
  } else if (definition.fieldType === consentFieldTypeValues.date) {
    value = isoDateToUs(value)
  } else if (value == null) {
    value = ''
  }

  return { ...definition, value }
}

export function needsConsentFieldOptions(fieldType) {
  return fieldType === consentFieldTypeValues.select
    || fieldType === consentFieldTypeValues.multiSelect
}

export function optionsTextFromConsentField(field) {
  return (field?.options ?? []).map(item => {
    if (item.completionStatus === 'DECLINED') {
      return `${item.label} | DECLINED`
    }

    return item.label
  }).join('\n')
}

export function optionsFromConsentFieldText(text) {
  return String(text ?? '')
    .split('\n')
    .map(item => normalizeConsentFieldOption(item))
    .filter(Boolean)
}

export function buildConsentVersionFieldBody(field, index = 0) {
  const type = String(field.fieldType ?? 'TEXT').toUpperCase()
  const body = {
    key: String(field.key ?? '').trim()
      || slugConsentFieldKey(field.label),
    label: String(field.label ?? '').trim(),
    /* eslint-disable-next-line camelcase -- API body */
    field_type: type,
    required: Boolean(field.required),
    /* eslint-disable-next-line camelcase -- API body */
    display_order: Number.isFinite(Number(field.displayOrder))
      ? Number(field.displayOrder)
      : index,
    placeholder: String(field.placeholder ?? '').trim() || null,
    /* eslint-disable-next-line camelcase -- API body */
    help_text: String(field.helpText ?? '').trim() || null,
    active: field.active !== false,
    /* eslint-disable-next-line camelcase -- API body */
    prefill_source: String(field.prefillSource ?? 'MANUAL')
      .toUpperCase(),
    /* eslint-disable-next-line camelcase -- API body */
    prefill_key: String(field.prefillKey ?? '').trim() || null,
    /* eslint-disable-next-line camelcase -- API body */
    read_only: Boolean(field.readOnly),
    /* eslint-disable-next-line camelcase -- API body */
    include_in_document: field.includeInDocument !== false,
    /* eslint-disable-next-line camelcase -- API body */
    required_when_field:
      String(field.requiredWhenField ?? '').trim() || null,
    /* eslint-disable-next-line camelcase -- API body */
    required_when_value:
      String(field.requiredWhenValue ?? '').trim() || null,
  }
  if (needsConsentFieldOptions(type)) {
    body.options = (field.options ?? []).map(item => {
      const option = {
        value: item.value,
        label: item.label,
      }
      if (item.completionStatus) {
        /* eslint-disable-next-line camelcase -- API body */
        option.completion_status = item.completionStatus
      }

      return option
    })
  }

  return body
}

export function consentFieldHasValue(field, value) {
  const type = field?.fieldType
  if (type === consentFieldTypeValues.checkbox) {
    return value === true
  }
  if (type === consentFieldTypeValues.multiSelect) {
    return Array.isArray(value) && value.length > 0
  }

  return String(value ?? '').trim() !== ''
}

function valueMatchesCondition(field, value, expected) {
  const wanted = String(expected ?? '').trim()
  if (!wanted) {
    return false
  }
  if (field?.fieldType === consentFieldTypeValues.checkbox) {
    return value === true
      && ['true', 'yes', '1', 'checked', 'on']
        .includes(wanted.toLowerCase())
  }
  if (field?.fieldType === consentFieldTypeValues.multiSelect) {
    return Array.isArray(value)
      && value.some(item => String(item).trim() === wanted)
  }

  return String(value ?? '').trim().toLowerCase() === wanted.toLowerCase()
}

export function isConsentFieldRequired(field, fields, valuesByKey) {
  if (field?.required) {
    return true
  }
  const whenField = String(field?.requiredWhenField ?? '').trim()
  const whenValue = String(field?.requiredWhenValue ?? '').trim()
  if (!whenField || !whenValue) {
    return false
  }
  const trigger = (Array.isArray(fields) ? fields : []).find(
    item => item.key === whenField,
  )

  return valueMatchesCondition(
    trigger,
    valuesByKey?.[whenField],
    whenValue,
  )
}

export function missingRequiredConsentFields(fields, valuesByKey) {
  const list = Array.isArray(fields) ? fields : []

  return list.filter(field => (
    isConsentFieldRequired(field, list, valuesByKey)
    && !consentFieldHasValue(field, valuesByKey?.[field.key])
  ))
}

export function buildConsentFieldValueWrites(fields, valuesByKey) {
  return (Array.isArray(fields) ? fields : [])
    .filter(field => field?.key)
    .map(field => ({
      key: field.key,
      value: valuesByKey?.[field.key]
        ?? emptyValueForConsentField(field.fieldType),
    }))
}

export function valuesByKeyFromConsentFields(fields) {
  const map = {}
  for (const field of Array.isArray(fields) ? fields : []) {
    if (!field?.key) {
      continue
    }
    map[field.key] = field.value
      ?? emptyValueForConsentField(field.fieldType)
  }

  return map
}

export function consentFieldTypeLabel(t, fieldType) {
  const match = consentFieldTypeOptions(t).find(
    item => item.value === fieldType,
  )

  return match?.label || fieldType
}
