import {
  clinicalResourceFieldKeys as fk,
  clinicalResourceStatusValues,
  clinicalResourceTitleMaxChars,
  clinicalResourceTypeValues,
} from 'components/constants.js'
import { adminTableStatusVariants } from 'src/constants/admin-table.js'
import { formatUserCreatedAt } from 'src/utils/user-list-display.js'
import { resolveClinicalResourceCategoryChipColors } from
  'src/utils/clinical-resource-category-colors.js'

function trim(value) {
  return String(value ?? '').trim()
}

export function formatClinicalResourceTitleDisplay(
  title,
  maxChars = clinicalResourceTitleMaxChars,
) {
  const full = trim(title)
  if (!full) {
    return {
      display: '—',
      full: '',
      truncated: false,
    }
  }
  if (full.length <= maxChars) {
    return {
      display: full,
      full,
      truncated: false,
    }
  }

  return {
    display: `${full.slice(0, maxChars)}...`,
    full,
    truncated: true,
  }
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
  const titleDisplay = formatClinicalResourceTitleDisplay(title)
  const contentPreview = trim(item.content)
  const url = trim(item.url)

  return {
    id: item.id,
    [fk.title]: title,
    titleDisplay: titleDisplay.display,
    titleTruncated: titleDisplay.truncated,
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

function clinicalResourcePriorityRank(row) {
  const pinned = Boolean(row?.[fk.pinned])
  const favorite = Boolean(row?.[fk.favorite])
  const status = String(row?.[fk.status] ?? '').toUpperCase()
  const isActive = status === clinicalResourceStatusValues.active

  // Inactive (and other non-active) always last — even if favorite/pinned.
  if (!isActive) {
    if (status === clinicalResourceStatusValues.inactive) {
      return 4
    }

    return 5
  }

  // Active only:
  // 1) pinned + favorite
  if (pinned && favorite) {
    return 0
  }
  // 2) pinned
  if (pinned) {
    return 1
  }
  // 3) favorite
  if (favorite) {
    return 2
  }
  // 4) active

  return 3
}

function resolveClinicalResourceSortValue(row, sortBy) {
  const key = String(sortBy ?? '').trim()
  if (!key || !row) {
    return ''
  }
  if (key === 'title') {
    return String(row[fk.title] ?? '').toLowerCase()
  }
  if (key === 'category') {
    return String(row[fk.category] ?? '').toLowerCase()
  }
  if (key === 'type') {
    return String(row.typeLabel ?? row[fk.type] ?? '').toLowerCase()
  }
  if (key === 'status') {
    return String(row.statusLabel ?? row[fk.status] ?? '').toLowerCase()
  }
  if (key === 'updatedAt') {
    return String(row.updatedAtRaw ?? '')
  }
  if (key === 'pinned') {
    return row[fk.pinned] ? 1 : 0
  }
  if (key === 'favorite') {
    return row[fk.favorite] ? 1 : 0
  }

  return String(row[key] ?? '').toLowerCase()
}

function compareSortValues(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }
  const left = String(a ?? '')
  const right = String(b ?? '')

  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

/**
 * Priority (active first):
 * 1) pinned + favorite
 * 2) pinned
 * 3) favorite
 * 4) active
 * 5) inactive (always last, even if favorite)
 * Within each group, apply the active column sort.
 */
export function sortClinicalResourceRows(
  rows,
  sortBy = 'title',
  descending = false,
) {
  const list = Array.isArray(rows) ? [...rows] : []
  const dir = descending ? -1 : 1

  return list.sort((a, b) => {
    const rankDiff = clinicalResourcePriorityRank(a)
      - clinicalResourcePriorityRank(b)
    if (rankDiff !== 0) {
      return rankDiff
    }
    const cmp = compareSortValues(
      resolveClinicalResourceSortValue(a, sortBy),
      resolveClinicalResourceSortValue(b, sortBy),
    )
    if (cmp !== 0) {
      return cmp * dir
    }

    return Number(a?.id ?? 0) - Number(b?.id ?? 0)
  })
}
