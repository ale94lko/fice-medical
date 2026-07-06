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
  const activeSubtenantId = Number(options.activeSubtenantId)
  const permissionTreeNodes = Array.isArray(options.permissionTreeNodes)
    ? options.permissionTreeNodes
    : []
  const permissions = normalizeNumericIds(user?.permissions)
  const modules = resolveModuleIdsFromSelection(
    permissions,
    permissionTreeNodes,
  )
  const allowedSubtenantIds = Number.isFinite(activeSubtenantId)
    ? [activeSubtenantId]
    : []
  const tenantStaffId = Number(user?.tenantStaffId)
  const body = {
    username: String(user?.email ?? '').trim(),
    password: String(user?.password ?? '').trim(),
    description: String(user?.description ?? '').trim(),
    status: mapUserStatusToApi(user?.status ?? user?.statusCode),
    changePassword: Boolean(
      user?.changePasswordRequired ?? user?.changePassword ?? true,
    ),
    newUser: true,
    roles: normalizeNumericIds(user?.roles),
    permissions,
    modules,
    allowedSubtenantIds,
  }

  if (Number.isFinite(tenantStaffId) && tenantStaffId > 0) {
    body.tenantStaffId = tenantStaffId
  }

  return body
}
