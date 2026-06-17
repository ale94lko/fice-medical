/* eslint-disable camelcase -- API request body uses snake_case */
import { buildClientRegisterBody } from
  'src/utils/build-client-register-body.js'
import { clientFormSections } from 'components/constants.js'
import { buildFollowUpsForSave } from 'src/utils/client-follow-ups.js'

/**
 * PATCH /client/v1/{id} — includes follow_ups only when there are changes.
 */
export function buildClientUpdateBody(form) {
  const body = buildClientRegisterBody(form)
  const followUps = buildFollowUpsForSave(form?.[clientFormSections.followUps])

  if (followUps.length > 0) {
    body.follow_ups = followUps
  } else {
    delete body.follow_ups
  }

  return body
}
