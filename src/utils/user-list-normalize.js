import {
  userFieldKeys as uk,
  userStatusValues,
} from 'components/constants.js'
import { adminTableStatusVariants } from 'src/constants/admin-table.js'
import { mapUserStatusFromApi } from 'src/utils/user-register-payload.js'

function trim(value) {
  return String(value ?? '').trim()
}

function resolveUserStatusVariant(status) {
  const token = trim(status).toUpperCase()
  if (token === userStatusValues.active) {
    return adminTableStatusVariants.active
  }
  if (token === userStatusValues.pending) {
    return adminTableStatusVariants.pending
  }
  if (token === userStatusValues.inactive) {
    return adminTableStatusVariants.inactive
  }

  return adminTableStatusVariants.other
}

function resolveUserDisplayName(item) {
  const explicit = trim(item?.name ?? item?.display_name ?? item?.displayName)
  if (explicit) {
    return explicit
  }
  const email = trim(item?.email)
  if (email) {
    const localPart = email.split('@')[0] ?? ''
    const words = localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    if (words.length) {
      return words.join(' ')
    }
  }

  return email || '—'
}

function normalizeRolesFromItem(item) {
  if (Array.isArray(item?.roles) && item.roles.length) {
    return item.roles.map(role => {
      if (role && typeof role === 'object') {
        const id = Number(role.id)
        const name = trim(role.name)

        return {
          id: Number.isFinite(id) ? id : null,
          name,
        }
      }
      const id = Number(role)
      if (Number.isFinite(id)) {
        return { id, name: '' }
      }
      const legacyName = trim(role).toUpperCase()
      if (legacyName) {
        return { id: null, name: legacyName }
      }

      return null
    }).filter(Boolean)
  }
  const legacy = trim(item?.role)
  if (legacy) {
    return [{ id: null, name: legacy.toUpperCase() }]
  }

  return []
}

function normalizePermissionCodes(item) {
  if (!Array.isArray(item?.permissions)) {
    return []
  }

  return item.permissions
    .map(code => trim(code).toUpperCase())
    .filter(Boolean)
}

function resolveRoleLabels(roles) {
  return roles
    .map(role => role.name || (role.id != null ? String(role.id) : ''))
    .filter(Boolean)
}

function resolveRoleIds(roles) {
  return roles
    .map(role => role.id)
    .filter(id => id != null && Number.isFinite(Number(id)))
}

export function mapUserListViewItem(item, t) {
  if (!item || item.id == null) {
    return null
  }

  const statusCode = mapUserStatusFromApi(item.status)
  const statusLabelKey = `userStatus${statusCode.charAt(0)}${
    statusCode.slice(1).toLowerCase()
  }`
  const translatedStatus = t(statusLabelKey)
  const status = translatedStatus !== statusLabelKey
    ? translatedStatus
    : statusCode

  const normalizedRoles = normalizeRolesFromItem(item)
  const roleLabels = resolveRoleLabels(normalizedRoles)
  const roleIds = resolveRoleIds(normalizedRoles)
  const permissions = normalizePermissionCodes(item)

  return {
    id: item.id,
    [uk.name]: resolveUserDisplayName(item),
    [uk.email]: trim(item.email ?? item.username),
    [uk.roles]: roleLabels,
    rolesCodes: roleIds.length ? roleIds : normalizedRoles.map(r => r.name),
    roleCode: roleIds[0] ?? normalizedRoles[0]?.name ?? '',
    [uk.role]: roleLabels.join(', ') || '—',
    [uk.permissions]: permissions,
    [uk.description]: trim(item.description),
    [uk.status]: status,
    statusCode,
    statusVariant: resolveUserStatusVariant(statusCode),
  }
}

export function mapUsersListFromApi(items = [], t) {
  return (items ?? [])
    .map(item => mapUserListViewItem(item, t))
    .filter(Boolean)
}
