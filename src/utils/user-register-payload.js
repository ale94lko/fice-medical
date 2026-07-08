import { userStatusValues } from 'components/constants.js'

const USER_STATUS_API_BY_CODE = {
  [userStatusValues.active]: 1,
  [userStatusValues.inactive]: 0,
}

const USER_STATUS_CODE_BY_API = {
  1: userStatusValues.active,
  0: userStatusValues.inactive,
  2: userStatusValues.inactive,
}

export function mapUserStatusFromApi(status) {
  const numeric = Number(status)
  if (Number.isFinite(numeric) && USER_STATUS_CODE_BY_API[numeric]) {
    return USER_STATUS_CODE_BY_API[numeric]
  }

  const token = String(status ?? '').trim().toUpperCase()
  if (
    token === userStatusValues.active
    || token === userStatusValues.inactive
  ) {
    return token
  }

  return userStatusValues.active
}

function normalizeNumericIds(values = []) {
  return (values ?? [])
    .map(value => Number(value))
    .filter(Number.isFinite)
}

function resolveRoleIdsForRequest(roles = [], roleOptions = []) {
  const direct = normalizeNumericIds(roles)
  if (direct.length) {
    return direct
  }

  const byName = new Map(
    (roleOptions ?? []).map(option => [
      String(option.label ?? option.name ?? '').trim().toUpperCase(),
      Number(option.value),
    ]),
  )

  return (roles ?? [])
    .map(role => {
      if (role && typeof role === 'object') {
        const id = Number(role.id ?? role.value)
        if (Number.isFinite(id)) {
          return id
        }

        const name = String(role.name ?? role.label ?? '').trim().toUpperCase()
        const match = byName.get(name)

        return Number.isFinite(match) ? match : null
      }

      const id = Number(role)
      if (Number.isFinite(id)) {
        return id
      }

      const match = byName.get(String(role ?? '').trim().toUpperCase())

      return Number.isFinite(match) ? match : null
    })
    .filter(id => id != null && Number.isFinite(id))
}

export function resolveTenantStaffIdFromUser(user) {
  const direct = Number(user?.tenantStaffId ?? user?.tenant_staff_id)
  if (Number.isFinite(direct) && direct > 0) {
    return direct
  }

  const fromStaff = Number(
    user?.staffMember?.id ?? user?.staff_member?.id,
  )
  if (Number.isFinite(fromStaff) && fromStaff > 0) {
    return fromStaff
  }

  return null
}

function buildUserMutationBody(user, options = {}, mutation = {}) {
  const {
    includePassword = false,
    includeChangePassword = false,
    includeNewUser = false,
    alwaysIncludeTenantStaffId = false,
  } = mutation
  const activeSubtenantId = Number(options.activeSubtenantId)
  const permissionTreeNodes = Array.isArray(options.permissionTreeNodes)
    ? options.permissionTreeNodes
    : []
  const roleOptions = Array.isArray(options.roleOptions)
    ? options.roleOptions
    : []
  const permissions = normalizeNumericIds(
    resolvePermissionIdsFromUserSelection(
      user?.permissions ?? [],
      permissionTreeNodes,
    ),
  )
  const modules = resolveModuleIdsFromSelection(
    permissions,
    permissionTreeNodes,
  )
  const roles = resolveRoleIdsForRequest(user?.roles, roleOptions)
  const allowedSubtenantIds = Number.isFinite(activeSubtenantId)
    ? [activeSubtenantId]
    : []
  const body = {
    username: String(user?.email ?? user?.username ?? '').trim(),
    description: String(user?.description ?? '').trim(),
    status: mapUserStatusToApi(user?.status ?? user?.statusCode),
    photoFileId: user?.photoFileId ?? user?.photo_file_id ?? null,
    roles,
    permissions,
    modules,
    allowedSubtenantIds,
  }

  if (includePassword) {
    body.password = String(user?.password ?? '').trim()
  }
  if (includeChangePassword) {
    body.changePassword = Boolean(
      user?.changePasswordRequired ?? user?.changePassword ?? true,
    )
  }
  if (includeNewUser) {
    body.newUser = true
  }

  const tenantStaffId = resolveTenantStaffIdFromUser(user)
  if (alwaysIncludeTenantStaffId) {
    body.tenantStaffId = tenantStaffId
  } else if (tenantStaffId != null) {
    body.tenantStaffId = tenantStaffId
  }

  return body
}

export function resolvePermissionIdsFromUserSelection(
  selectedPermissions = [],
  treeNodes = [],
) {
  const selectedTokens = new Set(
    (selectedPermissions ?? [])
      .map(value => String(value ?? '').trim())
      .filter(Boolean),
  )
  const ids = new Set()

  selectedTokens.forEach(token => {
    const numeric = Number(token)
    if (Number.isFinite(numeric)) {
      ids.add(numeric)
    }
  })

  treeNodes.forEach(node => {
    const children = Array.isArray(node?.children) ? node.children : []
    children.forEach(child => {
      const id = Number(child?.value)
      const code = String(child?.code ?? '').trim().toUpperCase()
      if (!Number.isFinite(id)) {
        return
      }
      if (
        selectedTokens.has(String(id))
        || (code && selectedTokens.has(code))
      ) {
        ids.add(id)
      }
    })
  })

  return Array.from(ids).sort((a, b) => a - b)
}

export function mapUserStatusToApi(status) {
  const token = String(status ?? '').trim().toUpperCase()
  const mapped = USER_STATUS_API_BY_CODE[token]
  if (mapped != null) {
    return mapped
  }

  const numeric = Number(status)
  if (Number.isFinite(numeric)) {
    return numeric
  }

  return USER_STATUS_API_BY_CODE[userStatusValues.active]
}

export function resolveModuleIdsFromSelection(
  selectedPermissions = [],
  treeNodes = [],
) {
  const selected = new Set(normalizeNumericIds(selectedPermissions))
  const moduleIds = new Set()

  treeNodes.forEach(node => {
    const moduleId = Number(node?.moduleId)
    if (!Number.isFinite(moduleId)) {
      return
    }
    const children = Array.isArray(node?.children) ? node.children : []
    const hasSelected = children.some(child => {
      const childId = Number(child?.value)

      return Number.isFinite(childId) && selected.has(childId)
    })
    if (hasSelected) {
      moduleIds.add(moduleId)
    }
  })

  return Array.from(moduleIds).sort((a, b) => a - b)
}

export function buildUserRegisterRequest(user, options = {}) {
  return buildUserMutationBody(user, options, {
    includePassword: true,
    includeChangePassword: true,
    includeNewUser: true,
  })
}

export function buildUserUpdateRequest(user, options = {}) {
  return buildUserMutationBody(user, options, {
    alwaysIncludeTenantStaffId: true,
  })
}
