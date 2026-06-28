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

export function mapTenantRolesToSelectOptions(roles = []) {
  return (roles ?? [])
    .filter(role => role?.id != null)
    .map(role => ({
      label: String(role.name ?? role.id).trim(),
      value: Number(role.id),
    }))
    .filter(option => Number.isFinite(option.value))
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
