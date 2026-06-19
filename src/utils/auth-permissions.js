const GRANULAR_PREFIXES = [
  'VIEW_', 'ADD_', 'EDIT_', 'DELETE_', 'CHANGE_', 'ARCHIVE_',
  'BOOK_', 'CANCEL_', 'RESCHEDULE_', 'MANAGE_', 'SIGN_',
]

export function isGranularPermissionToken(value) {
  const key = String(value ?? '').trim().toUpperCase()
  if (!key) {
    return false
  }

  return GRANULAR_PREFIXES.some(prefix => key.startsWith(prefix))
}

export function hasAssignedPermissions(permissions) {
  if (!Array.isArray(permissions) || !permissions.length) {
    return false
  }

  return permissions.some(item => isGranularPermissionToken(item))
}

export function hasPermission(permissions, permission) {
  if (!hasAssignedPermissions(permissions)) {
    return false
  }
  const key = String(permission ?? '').trim()
  if (!key) {
    return false
  }

  return permissions.includes(key)
}

export function hasAnyPermission(permissions, permissionList = []) {
  const keys = (permissionList ?? []).filter(Boolean)
  if (!keys.length) {
    return false
  }
  if (!hasAssignedPermissions(permissions)) {
    return false
  }

  return keys.some(
    permission => permissions.includes(String(permission).trim()),
  )
}

export function hasPermissionOrLegacyModule(permissions, permission) {
  return hasPermission(permissions, permission)
}

export function hasAnyPermissionOrLegacyModule(permissions, permissionList) {
  return hasAnyPermission(permissions, permissionList)
}
