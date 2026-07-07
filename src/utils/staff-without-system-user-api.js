import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'

export const STAFF_WITHOUT_SYSTEM_USER_LIST_LIMIT = 20

function readEnvelope(response) {
  return response?.data?.data ?? response?.data ?? {}
}

function readItems(envelope) {
  return Array.isArray(envelope.items) ? envelope.items : []
}

export function mapStaffWithoutSystemUserToSelectOption(row, t) {
  const id = Number(row?.id)
  if (!Number.isFinite(id)) {
    return null
  }

  const name = String(row?.name ?? '').trim()
  const staffNo = String(row?.staff_no ?? row?.code ?? row?.staffNo ?? '')
    .trim()
  const position = String(
    row?.position_label ?? row?.position ?? row?.positionLabel ?? '',
  ).trim()
  const isClinician = Boolean(
    row?.is_clinician ?? row?.position_is_clinical ?? row?.isClinician,
  )
  const captionParts = [staffNo, position].filter(Boolean)
  if (isClinician) {
    captionParts.push(t('clinician'))
  }

  return {
    label: name || staffNo || String(id),
    value: id,
    name,
    staffNo,
    position,
    isClinician,
    caption: captionParts.join(' · '),
  }
}

export function mapStaffMemberToSelectOption(staffMember, t) {
  if (!staffMember || staffMember.id == null) {
    return null
  }

  /* eslint-disable camelcase -- API list item shape */
  return mapStaffWithoutSystemUserToSelectOption({
    id: staffMember.id,
    name: staffMember.name,
    staff_no: staffMember.staffNo,
    position: staffMember.position,
    is_clinician: staffMember.isClinician,
  }, t)
  /* eslint-enable camelcase */
}

export function mapStaffWithoutSystemUserRows(items, t) {
  return (items ?? [])
    .map(item => mapStaffWithoutSystemUserToSelectOption(item, t))
    .filter(Boolean)
}

export function resolveStaffWithoutSystemUserHasMore(
  pagination,
  loadedCount,
  pageLimit = STAFF_WITHOUT_SYSTEM_USER_LIST_LIMIT,
) {
  const total = Number(pagination?.total)
  if (Number.isFinite(total) && total >= 0) {
    return loadedCount < total
  }

  const totalPages = Number(pagination?.totalPages)
  const page = Number(pagination?.page)
  if (
    Number.isFinite(totalPages)
    && totalPages > 0
    && Number.isFinite(page)
  ) {
    return page + 1 < totalPages
  }

  const pageItems = Number(pagination?.limit) || pageLimit

  return loadedCount >= pageLimit && pageItems >= pageLimit
}

/**
 * @param {Record<string, unknown>} params
 * @returns {Promise<{
 *   items: unknown[],
 *   options: ReturnType<typeof mapStaffWithoutSystemUserToSelectOption>[],
 *   pagination: Record<string, unknown>
 * }>}
 */
export async function fetchStaffWithoutSystemUserPage(
  params = {},
  t,
) {
  const query = {
    page: Math.max(0, Number(params.page ?? 0) || 0),
    limit: Math.max(
      1,
      Number(params.limit ?? STAFF_WITHOUT_SYSTEM_USER_LIST_LIMIT) || 20,
    ),
  }
  const q = String(params.q ?? '').trim()
  if (q) {
    query.q = q
  }
  const status = String(params.status ?? '').trim()
  if (status) {
    query.status = status
  }
  const position = String(params.position ?? '').trim()
  if (position) {
    query.position = position
  }

  const response = await apiInstance.get(
    apiPaths.staffWithoutSystemUser,
    { params: query },
  )
  const envelope = readEnvelope(response)
  const items = readItems(envelope)
  const pagination = extractEnvelopeListPagination(envelope) ?? {}

  return {
    items,
    options: mapStaffWithoutSystemUserRows(items, t),
    pagination,
  }
}
