import {
  userFieldKeys,
  userStatusValues,
} from 'components/constants.js'
import {
  buildUserUpdateRequest,
  resolveTenantStaffIdFromUser,
} from 'src/utils/user-register-payload.js'

function normalizeRoleId(value) {
  const id = Number(value)
  if (Number.isFinite(id)) {
    return id
  }

  return null
}

function normalizeRoles(user) {
  const fromCodes = Array.isArray(user?.rolesCodes)
    ? user.rolesCodes.filter(value => value != null && value !== '')
    : []
  if (fromCodes.length) {
    return fromCodes
      .map(value => normalizeRoleId(value) ?? String(value).trim())
      .filter(value => value !== '' && value != null)
  }
  if (Array.isArray(user?.roles) && user.roles.length) {
    return user.roles.map(role => {
      if (role && typeof role === 'object') {
        const id = normalizeRoleId(role.id)
        if (id != null) {
          return id
        }

        return trimRoleName(role.name)
      }
      const id = normalizeRoleId(role)
      if (id != null) {
        return id
      }

      return trimRoleName(role)
    }).filter(value => value !== '' && value != null)
  }
  const legacy = user?.roleCode ?? user?.role ?? user?.[userFieldKeys.role]
  if (legacy) {
    const id = normalizeRoleId(legacy)
    if (id != null) {
      return [id]
    }

    return [String(legacy).trim()]
  }

  return []
}

function trimRoleName(value) {
  return String(value ?? '').trim()
}

function normalizePermissions(user) {
  const fromField = user?.[userFieldKeys.permissions]
  if (Array.isArray(fromField) && fromField.length) {
    return fromField.map(code => String(code).trim()).filter(Boolean)
  }
  if (Array.isArray(user?.permissions) && user.permissions.length) {
    return user.permissions.map(code => String(code).trim()).filter(Boolean)
  }

  return []
}

export function createEmptyUser(overrides = {}) {
  return {
    id: null,
    [userFieldKeys.name]: '',
    email: '',
    password: '',
    roles: [],
    permissions: [],
    description: '',
    status: userStatusValues.active,
    statusCode: userStatusValues.active,
    [userFieldKeys.lastLogin]: '',
    tenantStaffId: null,
    changePasswordRequired: true,
    ...overrides,
  }
}

export function cloneUser(user) {
  if (!user) {
    return createEmptyUser()
  }

  const roles = normalizeRoles(user)
  const permissions = normalizePermissions(user)
  const tenantStaffId = resolveTenantStaffIdFromUser(user)

  return createEmptyUser({
    id: user.id ?? null,
    email: user.email ?? user[userFieldKeys.email] ?? user.username ?? '',
    password: String(user?.password ?? '').trim(),
    roles,
    permissions,
    description: user.description ?? user[userFieldKeys.description] ?? '',
    status: user.statusCode ?? user.status ?? userStatusValues.pending,
    statusCode: user.statusCode ?? user.status ?? userStatusValues.pending,
    [userFieldKeys.name]: user[userFieldKeys.name] ?? user.name ?? '',
    [userFieldKeys.lastLogin]:
      user[userFieldKeys.lastLogin] ?? user.lastLogin ?? '',
    tenantStaffId,
    staffMember: user.staffMember ?? user.staff_member ?? null,
    changePasswordRequired: Boolean(
      user.changePasswordRequired
      ?? user.change_password_required
      ?? user.changePassword
      ?? true,
    ),
  })
}

export function userToUpdatePayload(user, options = {}) {
  return buildUserUpdateRequest(user, options)
}
