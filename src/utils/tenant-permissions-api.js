import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mapPermissionGroupsToTreeNodes,
  normalizePermissionGroupsFromApi,
} from 'src/utils/permission-tree-utils.js'

function permissionCodeFromEntry(entry) {
  if (typeof entry === 'string') {
    return entry.trim()
  }
  if (!entry || typeof entry !== 'object') {
    return ''
  }

  return String(
    entry.name
    ?? entry.code
    ?? entry.permission_code
    ?? entry.permissionCode
    ?? '',
  ).trim()
}

export function extractCurrentUserPermissionCodes(payload) {
  const candidates = [
    payload?.data?.permissions,
    payload?.data?.data?.permissions,
    payload?.permissions,
    Array.isArray(payload?.data) ? payload.data : null,
    Array.isArray(payload) ? payload : null,
  ]

  for (const list of candidates) {
    if (!Array.isArray(list) || !list.length) {
      continue
    }

    return list.map(permissionCodeFromEntry).filter(Boolean)
  }

  return []
}

export async function fetchCurrentUserPermissionCodes() {
  const response = await apiInstance.get(apiPaths.permissionsForCurrentUser)

  return extractCurrentUserPermissionCodes(response.data)
}

export async function fetchTenantPermissionGroups() {
  const response = await apiInstance.get(apiPaths.permissionsForCurrentUser)

  return normalizePermissionGroupsFromApi(response.data)
}

export async function fetchTenantPermissionTreeNodes() {
  const groups = await fetchTenantPermissionGroups()

  return mapPermissionGroupsToTreeNodes(groups)
}
