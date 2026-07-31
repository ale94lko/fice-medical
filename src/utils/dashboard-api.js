import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  dashboardConfigToApiPayload,
  normalizeDashboardConfig,
  normalizeDashboardPayload,
} from 'src/utils/dashboard-normalize.js'

export async function fetchDashboard({ includeHidden = false } = {}) {
  const response = await apiInstance.get(apiPaths.dashboard, {
    params: {
      // eslint-disable-next-line camelcase -- API query param
      include_hidden: includeHidden,
    },
  })

  return normalizeDashboardPayload(response.data)
}

export async function fetchDashboardConfig() {
  const response = await apiInstance.get(apiPaths.dashboardConfig)

  return normalizeDashboardConfig(response.data)
}

export async function saveDashboardConfig(widgets) {
  const payload = dashboardConfigToApiPayload(widgets)
  const response = await apiInstance.put(
    apiPaths.dashboardConfig,
    payload,
  )

  return normalizeDashboardConfig(response.data)
}
