import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

function unwrapRoles(body) {
  if (Array.isArray(body?.data)) {
    return body.data
  }
  if (Array.isArray(body)) {
    return body
  }

  return []
}

function normalizePermissionId(value) {
  if (value == null) {
    return null
  }

  const id = Number(
    typeof value === 'object'
      ? value.id ?? value.permission_id ?? value.permissionId
      : value,
  )

  return Number.isFinite(id) ? id : null
}

export function extractRolePermissionIds(role) {
  if (!role || typeof role !== 'object') {
    return []
  }

  const ids = new Set()
  const direct = role.permissions
    ?? role.permission_ids
    ?? role.permissionIds

  if (Array.isArray(direct)) {
    direct.forEach(item => {
      const id = normalizePermissionId(item)
      if (id != null) {
        ids.add(id)
      }
    })
  }

  const modules = role.modules
  if (Array.isArray(modules)) {
    modules.forEach(module => {
      const perms = module?.permissions
        ?? module?.permission_ids
        ?? module?.permissionIds
        ?? []
      if (!Array.isArray(perms)) {
        return
      }
      perms.forEach(item => {
        const id = normalizePermissionId(item)
        if (id != null) {
          ids.add(id)
        }
      })
    })
  }

  return Array.from(ids)
}

export function mapTenantRolesToSelectOptions(roles = []) {
  return (roles ?? [])
    .filter(role => role?.id != null)
    .map(role => {
      const label = String(role.name ?? role.id).trim()

      return {
        label,
        value: Number(role.id),
        permissionIds: extractRolePermissionIds(role),
        icon: resolveRoleIcon(label),
      }
    })
    .filter(option => Number.isFinite(option.value))
}

const ROLE_ICON_RULES = [
  { test: name => /ADMIN/i.test(name), icon: 'shield' },
  { test: name => /REPORT/i.test(name), icon: 'description' },
  { test: name => /SETTINGS/i.test(name), icon: 'settings' },
  {
    test: name => /TEST|PRUEBA/i.test(name),
    icon: 'person_add_alt_1',
  },
  {
    test: name => /^USER$/i.test(name) || /\bUSER\b/i.test(name),
    icon: 'person',
  },
]

export function resolveRoleIcon(roleName) {
  const name = String(roleName ?? '').trim()
  if (!name) {
    return 'badge'
  }

  const match = ROLE_ICON_RULES.find(rule => rule.test(name))

  return match?.icon ?? 'badge'
}

export function formatRoleLabel(roleName) {
  return String(roleName ?? '').trim().toUpperCase()
}

export function applyRoleSelectionToPermissions({
  previousRoleIds = [],
  nextRoleIds = [],
  currentPermissionIds = [],
  roleOptions = [],
}) {
  const prev = new Set(
    (previousRoleIds ?? []).map(value => Number(value)).filter(Number.isFinite),
  )
  const next = new Set(
    (nextRoleIds ?? []).map(value => Number(value)).filter(Number.isFinite),
  )
  const added = [...next].filter(id => !prev.has(id))
  const removed = [...prev].filter(id => !next.has(id))

  if (!added.length && !removed.length) {
    return [...(currentPermissionIds ?? [])]
  }

  const rolePermissionMap = new Map(
    (roleOptions ?? []).map(option => [
      Number(option.value),
      (option.permissionIds ?? [])
        .map(value => Number(value))
        .filter(Number.isFinite),
    ]),
  )
  const permissionSet = new Set(
    (currentPermissionIds ?? [])
      .map(value => Number(value))
      .filter(Number.isFinite),
  )

  for (const roleId of added) {
    (rolePermissionMap.get(roleId) ?? []).forEach(id => {
      permissionSet.add(id)
    })
  }

  for (const roleId of removed) {
    const removedPerms = rolePermissionMap.get(roleId) ?? []
    const remainingPerms = new Set()
    for (const otherRoleId of next) {
      (rolePermissionMap.get(otherRoleId) ?? []).forEach(id => {
        remainingPerms.add(id)
      })
    }
    for (const permId of removedPerms) {
      if (!remainingPerms.has(permId)) {
        permissionSet.delete(permId)
      }
    }
  }

  return Array.from(permissionSet)
}

export function mergeRolePermissionsIntoSelection({
  selectedRoleIds = [],
  currentPermissionIds = [],
  roleOptions = [],
}) {
  const permissionSet = new Set(
    (currentPermissionIds ?? [])
      .map(value => Number(value))
      .filter(Number.isFinite),
  )

  for (const roleId of selectedRoleIds ?? []) {
    const match = (roleOptions ?? []).find(
      option => Number(option.value) === Number(roleId),
    )
    ;(match?.permissionIds ?? []).forEach(id => {
      const parsed = Number(id)
      if (Number.isFinite(parsed)) {
        permissionSet.add(parsed)
      }
    })
  }

  return Array.from(permissionSet)
}

export async function fetchTenantRoles(tenantId) {
  const id = Number(tenantId)
  if (!Number.isFinite(id)) {
    return []
  }

  const response = await apiInstance.get(
    apiPaths.tenantRolesByTenantId(id),
  )

  return unwrapRoles(response.data)
}

export async function fetchTenantRoleOptions(tenantId) {
  const roles = await fetchTenantRoles(tenantId)

  return mapTenantRolesToSelectOptions(roles)
}
