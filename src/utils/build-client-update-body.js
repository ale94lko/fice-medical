/* eslint-disable camelcase -- API request body uses snake_case */
import { buildClientRegisterBody } from
  'src/utils/build-client-register-body.js'
import { clientFormSections } from 'components/constants.js'
import { buildFollowUpsForSave } from 'src/utils/client-follow-ups.js'

/**
 * PATCH /client/v1/{id} — includes follow_ups / labs only when there are
 * changes (empty arrays would wipe existing records on replace).
 */
export function buildClientUpdateBody(form) {
  const body = buildClientRegisterBody(form)
  if (body.basic_info?.id_number == null) {
    delete body.basic_info.id_number
  }
  const followUps = buildFollowUpsForSave(form?.[clientFormSections.followUps])

  if (followUps.length > 0) {
    body.follow_ups = followUps
  } else {
    delete body.follow_ups
  }

  if (!Array.isArray(body.labs) || body.labs.length === 0) {
    delete body.labs
  }

  return body
}
