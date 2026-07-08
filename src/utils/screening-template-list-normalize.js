import { screeningTemplateStatusValues } from 'components/constants.js'
import { normalizeTemplateStatusValue } from
  'src/utils/screening-template-form.js'

const STATUS_VARIANTS = {
  [screeningTemplateStatusValues.active]: 'active',
  [screeningTemplateStatusValues.inactive]: 'inactive',
  [screeningTemplateStatusValues.archived]: 'archived',
}

export function screeningTemplateStatusLabel(status, t) {
  const value = normalizeTemplateStatusValue(status)
  if (value === screeningTemplateStatusValues.inactive) {
    return t('screeningTemplateStatusInactive')
  }
  if (value === screeningTemplateStatusValues.archived) {
    return t('screeningTemplateStatusArchived')
  }

  return t('screeningTemplateStatusActive')
}

export function mapScreeningTemplateListItem(raw, t) {
  if (!raw || raw.id == null) {
    return null
  }
  const status = normalizeTemplateStatusValue(raw.status)

  return {
    id: raw.id,
    name: String(raw.name ?? '').trim(),
    description: String(raw.description ?? '').trim(),
    category: String(raw.category ?? '').trim(),
    version: Number(raw.version ?? 1),
    status,
    statusLabel: screeningTemplateStatusLabel(status, t),
    statusVariant: STATUS_VARIANTS[status] ?? 'other',
  }
}
