import {
  clinicalResourceFieldKeys as fk,
  clinicalResourceStatusValues,
  clinicalResourceTypeValues,
} from 'components/constants.js'
import { adminTableStatusVariants } from 'src/constants/admin-table.js'
import { formatUserCreatedAt } from 'src/utils/user-list-display.js'
import { resolveClinicalResourceCategoryChipColors } from
  'src/utils/clinical-resource-category-colors.js'

function trim(value) {
  return String(value ?? '').trim()
}

function resolveStatusVariant(status) {
  const token = trim(status).toUpperCase()
  if (token === clinicalResourceStatusValues.active) {
    return adminTableStatusVariants.active
  }
  if (token === clinicalResourceStatusValues.inactive) {
    return adminTableStatusVariants.inactive
  }
  if (token === clinicalResourceStatusValues.archived) {
    return adminTableStatusVariants.other
  }

  return adminTableStatusVariants.other
}

function resolveTypeIcon(type) {
  const token = trim(type)
  if (token === clinicalResourceTypeValues.document) {
    return 'description'
  }

  return 'language'
}

export function mapClinicalResourceListItem(item, t) {
  if (!item || item.id == null) {
    return null
  }

  const type = trim(item.type)
  const status = trim(item.status).toUpperCase()
    || clinicalResourceStatusValues.active
  const typeLabelKey = type === clinicalResourceTypeValues.document
    ? 'clinicalResourceTypeDocument'
    : 'clinicalResourceTypeExternalLink'
  const translatedType = t(typeLabelKey)
  const typeLabel = translatedType !== typeLabelKey ? translatedType : type

  const statusLabelKey = `clinicalResourceStatus${
    status.charAt(0) + status.slice(1).toLowerCase()
  }`
  const translatedStatus = t(statusLabelKey)
  const statusLabel = translatedStatus !== statusLabelKey
    ? translatedStatus
    : status

  const updatedAtRaw = item.updated_at ?? item.updatedAt ?? ''
  const updatedAtLabel = formatUserCreatedAt(updatedAtRaw) || '—'
  const category = trim(
    item.category
    ?? item.category_name
    ?? item.categoryName,
  )
  const title = trim(item.title)
  const contentPreview = trim(item.content)
  const url = trim(item.url)

  return {
    id: item.id,
    [fk.title]: title,
    [fk.category]: category,
    categoryChip: resolveClinicalResourceCategoryChipColors(category),
    [fk.type]: type,
    typeLabel,
    typeIcon: resolveTypeIcon(type),
    [fk.keywords]: Array.isArray(item.keywords) ? item.keywords : [],
    [fk.content]: contentPreview,
    [fk.url]: url,
    [fk.status]: status,
    statusLabel,
    statusVariant: resolveStatusVariant(status),
    [fk.pinned]: Boolean(item.pinned),
    [fk.favorite]: Boolean(item.favorite),
    pinnedOrder: item.pinned_order ?? item.pinnedOrder ?? null,
    [fk.updatedAt]: updatedAtLabel,
    updatedAtRaw,
    storedFileId: item.stored_file_id ?? item.storedFileId ?? null,
    document: item.document ?? null,
    subtitle: type === clinicalResourceTypeValues.document
      ? contentPreview.slice(0, 120)
      : url,
  }
}
