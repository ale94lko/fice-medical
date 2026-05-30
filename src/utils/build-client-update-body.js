/* eslint-disable camelcase -- API body uses snake_case */
import { buildClientRegisterBody } from
  'src/utils/build-client-register-body.js'

export function buildClientUpdateBody(clientId, form) {
  const id = Number(clientId)
  const body = buildClientRegisterBody(form)

  return {
    client_id: Number.isFinite(id) ? id : clientId,
    ...body,
  }
}
