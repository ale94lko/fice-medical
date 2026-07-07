function trim(value) {
  return String(value ?? '').trim()
}

/**
 * Normalizes optional system_user from staff list/detail API.
 * Returns null when absent.
 */
export function normalizeStaffSystemUserFromApi(raw) {
  const systemUser = raw?.system_user ?? raw?.systemUser
  if (!systemUser || typeof systemUser !== 'object') {
    return null
  }

  const tenantUserId = Number(
    systemUser.tenant_user_id ?? systemUser.tenantUserId,
  )
  const roleId = Number(systemUser.role_id ?? systemUser.roleId)
  const username = trim(systemUser.username)
  const roleName = trim(systemUser.role_name ?? systemUser.roleName)
  const enabled = Boolean(systemUser.enabled)

  if (
    !username
    && !roleName
    && !Number.isFinite(tenantUserId)
    && !Number.isFinite(roleId)
  ) {
    return null
  }

  return {
    enabled,
    tenantUserId: Number.isFinite(tenantUserId) && tenantUserId > 0
      ? tenantUserId
      : null,
    username,
    roleId: Number.isFinite(roleId) && roleId > 0 ? roleId : null,
    roleName,
  }
}
