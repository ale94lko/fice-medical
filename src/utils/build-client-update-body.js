import { buildClientRegisterBody } from
  'src/utils/build-client-register-body.js'

/**
 * PATCH /client/v1/{id} — same payload shape as register, without client_id.
 */
export function buildClientUpdateBody(form) {
  return buildClientRegisterBody(form)
}
