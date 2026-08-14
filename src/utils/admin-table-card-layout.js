import { isEmpty } from 'src/utils/base.js'

const TITLE_CANDIDATES = ['name', 'user', 'title']
const SUBTITLE_CANDIDATES = ['position', 'category', 'roles', 'code']
const ID_CANDIDATES = [
  'staffNo',
  'clientNumber',
  'code',
  'entityId',
  'clientId',
]
const CONTACT_CANDIDATES = ['email']
const STATUS_CANDIDATES = ['status']

function colNames(cols) {
  return (Array.isArray(cols) ? cols : [])
    .map(col => col?.name)
    .filter(Boolean)
}

function pickFirst(names, candidates) {
  return candidates.find(name => names.includes(name)) || null
}

function isBlankDisplay(value) {
  if (isEmpty(value)) {
    return true
  }
  if (value === false) {
    return true
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()

    return !trimmed || trimmed === '—' || trimmed === '-'
  }
  if (Array.isArray(value)) {
    return value.length === 0
  }

  return false
}

export function formatCardColValue(col) {
  const value = col?.value
  if (isBlankDisplay(value)) {
    return ''
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : ''
  }
  if (Array.isArray(value)) {
    const parts = value.map(item => {
      if (item == null) {
        return ''
      }
      if (typeof item !== 'object') {
        return String(item)
      }
      if (item.badgeLabel) {
        return String(item.badgeLabel)
      }
      if (item.phone) {
        return item.typeLabel
          ? `${item.phone} ${item.typeLabel}`
          : String(item.phone)
      }
      if (item.email) {
        return item.typeLabel
          ? `${item.email} ${item.typeLabel}`
          : String(item.email)
      }
      if (item.label) {
        return String(item.label)
      }
      if (item.name) {
        return String(item.name)
      }
      if (item.displayName) {
        return String(item.displayName)
      }
      if (item.initials) {
        return String(item.initials)
      }

      return ''
    }).filter(Boolean)

    return parts.join(', ')
  }
  if (typeof value === 'object') {
    if (value.badgeLabel) {
      return String(value.badgeLabel)
    }
    if (value.label) {
      return String(value.label)
    }
    if (value.name) {
      return String(value.name)
    }

    return ''
  }

  return String(value)
}

/**
 * Normalize list-page cardLayout config against visible columns.
 */
export function resolveAdminTableCardLayout(cols, config = {}) {
  const columns = Array.isArray(cols) ? cols.filter(col => col?.name) : []
  const names = colNames(columns)
  const exclude = new Set([
    'actions',
    ...(Array.isArray(config.exclude) ? config.exclude : []),
  ])

  const title = config.title || pickFirst(names, TITLE_CANDIDATES) || names[0]
  const subtitle = config.subtitle === undefined
    ? pickFirst(names, SUBTITLE_CANDIDATES)
    : config.subtitle
  const titleExtra = config.titleExtra === undefined
    ? null
    : config.titleExtra
  const status = config.status === undefined
    ? pickFirst(names, STATUS_CANDIDATES)
    : config.status
  const contact = config.contact === undefined
    ? pickFirst(names, CONTACT_CANDIDATES)
    : config.contact

  let identifier = config.identifier
  if (identifier === undefined) {
    const idCol = pickFirst(names, ID_CANDIDATES)
    identifier = idCol
      ? { column: idCol, labelKey: 'adminTableCardNoLabel' }
      : null
  } else if (typeof identifier === 'string') {
    identifier = {
      column: identifier,
      labelKey: 'adminTableCardNoLabel',
    }
  }

  const reserved = new Set(
    [title, subtitle, titleExtra, status, contact, identifier?.column]
      .filter(Boolean),
  )

  const hasHideMap = config.hideIfSameAs
    && typeof config.hideIfSameAs === 'object'
  const hideIfSameAs = hasHideMap ? config.hideIfSameAs : {}

  Object.keys(hideIfSameAs).forEach(name => exclude.add(name))

  let badges = Array.isArray(config.badges) ? [...config.badges] : null
  if (!badges) {
    badges = names.filter(name => (
      !exclude.has(name) && !reserved.has(name)
    ))
  } else {
    badges = badges.filter(name => (
      names.includes(name)
      && !exclude.has(name)
      && !reserved.has(name)
    ))
  }

  let footerBadges = Array.isArray(config.footerBadges)
    ? config.footerBadges.filter(name => names.includes(name))
    : badges.filter(name => name === 'clinician')
  footerBadges = footerBadges.filter(name => !exclude.has(name))
  const footerSet = new Set(footerBadges)
  badges = badges.filter(name => !footerSet.has(name))

  const idColumn = identifier?.column
  const hasIdentifier = idColumn && names.includes(idColumn)
  const resolvedIdentifier = hasIdentifier
    ? {
      column: idColumn,
      labelKey: identifier.labelKey || '',
      label: identifier.label || '',
    }
    : null

  return {
    title: title && names.includes(title) ? title : null,
    subtitle: subtitle && names.includes(subtitle) ? subtitle : null,
    titleExtra: titleExtra && names.includes(titleExtra)
      ? titleExtra
      : null,
    status: status && names.includes(status) ? status : null,
    contact: contact && names.includes(contact) ? contact : null,
    identifier: resolvedIdentifier,
    badges,
    footerBadges,
    hideEmpty: config.hideEmpty !== false,
    hideIfSameAs,
    exclude,
  }
}

/** Initials for card avatar (e.g. "Mr. Carlos Gomez" → "CG"). */
export function cardAvatarInitials(text) {
  const cleaned = String(text || '')
    .replace(/^(mr|ms|mrs|dr|miss)\.?\s+/i, '')
    .trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (!parts.length) {
    return '?'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  const first = parts[0][0] || ''
  const last = parts[parts.length - 1][0] || ''

  return `${first}${last}`.toUpperCase()
}

export function findCardColumn(cols, name) {
  if (!name) {
    return null
  }

  return (Array.isArray(cols) ? cols : []).find(col => col?.name === name)
    || null
}

export function shouldShowCardField(col, layout, colsByName) {
  if (!col) {
    return false
  }
  if (layout.exclude.has(col.name)) {
    return false
  }

  const sameAs = layout.hideIfSameAs[col.name]
  if (sameAs) {
    const other = colsByName[sameAs]
    const a = formatCardColValue(col).trim().toLowerCase()
    const b = formatCardColValue(other).trim().toLowerCase()
    if (a && b && a === b) {
      return false
    }
  }

  if (layout.hideEmpty && !formatCardColValue(col)) {
    return false
  }

  return true
}

export function isTruthyCardValue(value) {
  return value === true || value === 1 || value === '1' || value === 'true'
}
