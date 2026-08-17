import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

export async function inviteClientToPortal(clientId, email) {
  const body = email ? { email } : {}
  const response = await apiInstance.post(
    apiPaths.clientPortalInvitations(clientId),
    body,
  )
  return response.data
}
