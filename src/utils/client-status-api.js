import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

function readEnvelope(response) {
  return response?.data?.data ?? response?.data ?? {}
}

export async function patchClientStatus(clientNumber, status) {
  const response = await apiInstance.patch(
    apiPaths.clientStatus(clientNumber),
    { status },
  )

  return readEnvelope(response)
}

export async function patchClientStatusBulk(clientNumbers, status) {
  const results = await Promise.all(
    clientNumbers.map(number => patchClientStatus(number, status)),
  )

  return results
}
