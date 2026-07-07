import {
  staffStaffTypes,
  staffCredentialStatuses,
} from 'components/constants.js'
import { staffStatuses } from 'components/constants.js'

/* eslint-disable camelcase -- API query param keys for staff list filters */
export const STAFF_LIST_SUMMARY_FILTERS = {
  totalStaff: {},
  clinicians: { staff_type: staffStaffTypes.clinicians },
  activeStaff: { status: staffStatuses.active },
  onLeave: { status: staffStatuses.onLeave },
  expiringCredentials: {
    credential_status: staffCredentialStatuses.expiringSoon,
  },
}

/* eslint-enable camelcase */

export function createEmptyStaffListFilters() {
  return {
    employmentStatuses: [],
    positions: [],
    staffType: staffStaffTypes.all,
    credentialStatus: '',
    hireDateFrom: '',
    hireDateTo: '',
  }
}

export function countActiveStaffListFilters(filters) {
  if (!filters) {
    return 0
  }
  let count = 0
  if (filters.employmentStatuses?.length) {
    count += 1
  }
  if (filters.positions?.length) {
    count += 1
  }
  if (
    filters.staffType
    && filters.staffType !== staffStaffTypes.all
  ) {
    count += 1
  }
  if (filters.credentialStatus) {
    count += 1
  }
  if (filters.hireDateFrom || filters.hireDateTo) {
    count += 1
  }

  return count
}

export function buildStaffListQueryParams({
  page = 0,
  limit = 20,
  q = '',
  summaryFilter = null,
  filters = null,
} = {}) {
  /* eslint-disable camelcase -- query params for /staff/v1 */
  const params = {
    page: Math.max(0, Number(page) || 0),
    limit: Math.max(1, Number(limit) || 20),
  }
  const trimmedQ = String(q ?? '').trim()
  if (trimmedQ) {
    params.q = trimmedQ
  }

  const panel = filters ?? {}
  const summaryParams = summaryFilter
    ? STAFF_LIST_SUMMARY_FILTERS[summaryFilter]
    : null

  if (summaryParams?.status) {
    params.status = summaryParams.status
  }
  if (summaryParams?.staff_type) {
    params.staff_type = summaryParams.staff_type
  }
  if (summaryParams?.credential_status) {
    params.credential_status = summaryParams.credential_status
  }

  if (
    Array.isArray(panel.employmentStatuses)
    && panel.employmentStatuses.length
  ) {
    params.status = panel.employmentStatuses.join(',')
  }
  if (Array.isArray(panel.positions) && panel.positions.length) {
    params.position = panel.positions.join(',')
  }
  if (
    panel.staffType
    && panel.staffType !== staffStaffTypes.all
  ) {
    params.staff_type = panel.staffType
  }
  if (panel.credentialStatus) {
    params.credential_status = panel.credentialStatus
  }
  if (panel.hireDateFrom) {
    params.hire_from = panel.hireDateFrom
  }
  if (panel.hireDateTo) {
    params.hire_to = panel.hireDateTo
  }

  /* eslint-enable camelcase */
  return params
}

export function staffListFiltersToApiPayload(filters) {
  if (!filters) {
    return {}
  }

  return {
    employmentStatuses: [...(filters.employmentStatuses ?? [])],
    positions: [...(filters.positions ?? [])],
    staffType: filters.staffType ?? staffStaffTypes.all,
    credentialStatus: filters.credentialStatus ?? '',
    hireDateFrom: filters.hireDateFrom ?? '',
    hireDateTo: filters.hireDateTo ?? '',
  }
}
