import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mapPermissionGroupsToTreeNodes,
  normalizePermissionGroupsFromApi,
} from 'src/utils/permission-tree-utils.js'

export async function fetchTenantPermissionGroups() {
  const response = await apiInstance.get(apiPaths.permissionsForCurrentUser)

  return normalizePermissionGroupsFromApi(response.data)
}

export async function fetchTenantPermissionTreeNodes() {
  const groups = await fetchTenantPermissionGroups()

  return mapPermissionGroupsToTreeNodes(groups)
}
