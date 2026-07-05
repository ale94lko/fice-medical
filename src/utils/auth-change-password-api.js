import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

export async function changeInitialPassword({
  newPassword,
  confirmNewPassword,
}) {
  const response = await apiInstance.post(
    apiPaths.oauthChangeInitialPassword,
    {
      newPassword: String(newPassword ?? '').trim(),
      confirmNewPassword: String(confirmNewPassword ?? '').trim(),
    },
  )

  return response.data
}

export async function changeAuthenticatedPassword({
  currentPassword,
  newPassword,
  confirmNewPassword,
}) {
  const response = await apiInstance.post(
    apiPaths.oauthChangePassword,
    {
      currentPassword: String(currentPassword ?? '').trim(),
      newPassword: String(newPassword ?? '').trim(),
      confirmNewPassword: String(confirmNewPassword ?? '').trim(),
    },
  )

  return response.data
}
