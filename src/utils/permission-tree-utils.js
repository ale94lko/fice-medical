const ACTION_PREFIXES = [
  'VIEW_',
  'EDIT_',
  'ADD_',
  'DELETE_',
  'CHANGE_',
  'ARCHIVE_',
  'SIGN_',
  'BOOK_',
  'CANCEL_',
  'RESCHEDULE_',
  'GENERATE_',
  'MANAGE_',
]

const MODULE_LABELS = {
  ADDRESS: 'Address',
  ALLERGIES: 'Allergies',
  APPOINTMENT_SLOT: 'Appointments',
  APPOINTMENTS: 'Appointments',
  BASIC_INFO_CLIENT: 'Client',
  CLIENT: 'Client',
  BILLING: 'Billing',
  CARE_PLANS: 'Care Plans',
  CLINICAL_NOTES: 'Clinical Notes',
  CLINICAL_AUDIT: 'Clinical Audit',
  CLINICIANS: 'Clinicians',
  CONTACT: 'Contact',
  FOLLOW_UPS: 'Follow Ups',
  LABS_CLIENT: 'Labs',
  MEDICAL_HISTORY: 'Medical History',
  MEDICAL_NOTES_CLIENT: 'Clinical Notes',
  REFERRALS: 'Referrals',
  SCREENINGS: 'Screenings',
  STAFF_MEMBERS: 'Staff Members',
  TENANTS: 'Tenants',
  TENANTS_BILLING: 'Billing',
  TENANTS_USER: 'Tenants User',
  VITALS_CLIENT: 'Vitals',
}

function extractModuleKey(code) {
  const upper = String(code ?? '').trim().toUpperCase()
  if (!upper) {
    return 'OTHER'
  }
  for (const prefix of ACTION_PREFIXES) {
    if (upper.startsWith(prefix)) {
      return upper.slice(prefix.length)
    }
  }

  return upper
}

export function formatModuleLabel(moduleKey) {
  const key = String(moduleKey ?? '').trim().toUpperCase()
  if (MODULE_LABELS[key]) {
    return MODULE_LABELS[key]
  }
  if (!key) {
    return 'Other'
  }

  return key
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

const MODULE_ICONS = {
  ADDRESS: 'place',
  ALLERGIES: 'vaccines',
  APPOINTMENT: 'event',
  APPOINTMENTS: 'event',
  APPOINTMENT_SLOT: 'event',
  BASIC_INFO_CLIENT: 'person',
  CLIENT: 'person',
  BILLING: 'payments',
  CARE_PLANS: 'assignment',
  CLINICAL_NOTES: 'description',
  CLINICAL_AUDIT: 'fact_check',
  CLINICIANS: 'medical_services',
  CONTACT: 'contact_phone',
  FOLLOW_UPS: 'follow_the_signs',
  LABS_CLIENT: 'science',
  MEDICAL_HISTORY: 'history_edu',
  MEDICAL_NOTES_CLIENT: 'description',
  REFERRALS: 'share',
  SCREENINGS: 'monitor_heart',
  STAFF_MEMBERS: 'badge',
  TENANTS: 'apartment',
  TENANTS_BILLING: 'payments',
  TENANTS_USER: 'manage_accounts',
  VITALS_CLIENT: 'favorite',
}

export function resolvePermissionModuleIcon(moduleKey, moduleLabel = '') {
  const key = String(moduleKey ?? '').trim().toUpperCase()
  if (MODULE_ICONS[key]) {
    return MODULE_ICONS[key]
  }

  const label = String(moduleLabel ?? '').trim().toLowerCase()
  if (label.includes('address')) {
    return 'place'
  }
  if (label.includes('appointment')) {
    return 'event'
  }
  if (label.includes('billing')) {
    return 'payments'
  }
  if (label.includes('clinical')) {
    return 'description'
  }
  if (label.includes('care plan')) {
    return 'assignment'
  }
  if (label.includes('allerg')) {
    return 'vaccines'
  }

  return 'folder'
}

function normalizePermissionEntry(entry, moduleId) {
  if (entry?.permission && typeof entry.permission === 'object') {
    return normalizePermissionEntry(entry.permission, moduleId)
  }
  if (typeof entry === 'string') {
    const code = entry.trim()

    return {
      id: null,
      code,
      label: code,
      description: '',
      moduleId,
    }
  }
  const id = Number(
    entry?.id
    ?? entry?.permission_id
    ?? entry?.permissionId
    ?? entry?.permission?.id,
  )
  const code = String(
    entry?.code
    ?? entry?.permission_code
    ?? entry?.name
    ?? entry?.permission?.code
    ?? entry?.permission?.permission_code
    ?? entry?.permission?.name
    ?? '',
  ).trim()
  const description = String(
    entry?.description
    ?? entry?.permission?.description
    ?? '',
  ).trim()
  const label = String(
    entry?.label
    ?? entry?.name
    ?? entry?.permission?.label
    ?? entry?.permission?.name
    ?? code,
  ).trim() || code

  return {
    id: Number.isFinite(id) ? id : null,
    code,
    label,
    description,
    moduleId,
  }
}

function unwrapPermissionRows(payload) {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const candidates = [
    payload.data?.permissions,
    payload.permissions,
    payload.data,
    payload.data?.data,
    payload.data?.modules,
    payload.data?.items,
    payload.modules,
    payload.items,
    payload,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate
    }
  }

  return []
}

export function mapPermissionGroupsToTreeNodes(groups = []) {
  return (groups ?? []).map(group => {
    const moduleId = Number(group?.moduleId ?? group?.module_id)
    const moduleKey = String(group?.moduleKey ?? '').trim()

    return {
      id: Number.isFinite(moduleId)
        ? `module:${moduleId}`
        : `module:${moduleKey}`,
      label: group.moduleLabel,
      moduleId: Number.isFinite(moduleId) ? moduleId : null,
      moduleKey: String(group?.moduleKey ?? moduleKey ?? '').trim(),
      children: (group.permissions ?? []).map(perm => {
        const entry = typeof perm === 'string'
          ? { code: perm, id: null, label: perm }
          : perm
        const permId = Number(entry?.id)
        const code = String(entry?.code ?? entry?.label ?? '').trim()
        if (!Number.isFinite(permId)) {
          return null
        }

        return {
          id: String(permId),
          label: entry?.label ?? code,
          code,
          description: entry?.description ?? '',
          value: permId,
          moduleId: Number.isFinite(moduleId) ? moduleId : null,
        }
      }).filter(Boolean),
    }
  })
}

export function normalizePermissionGroupsFromApi(payload) {
  const rows = unwrapPermissionRows(payload)

  if (!rows.length) {
    return []
  }

  if (rows.every(row => Array.isArray(row?.permissions))) {
    return rows
      .map(row => {
        const moduleId = Number(
          row.module_id ?? row.moduleId ?? row.module?.id ?? row.id,
        )
        const moduleKey = String(
          row.module ?? row.module_key ?? row.moduleKey ?? row.name ?? '',
        )
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '_')

        return {
          moduleKey,
          moduleId: Number.isFinite(moduleId) ? moduleId : null,
          moduleLabel: String(
            row.module_label ?? row.moduleLabel ?? row.module ?? row.name ?? '',
          ).trim(),
          permissions: (row.permissions ?? [])
            .map(entry => normalizePermissionEntry(
              entry,
              Number.isFinite(moduleId) ? moduleId : null,
            ))
            .filter(entry => entry.code || entry.id != null),
        }
      })
      .filter(group => group.permissions.length)
      .map(group => ({
        ...group,
        moduleLabel: group.moduleLabel || formatModuleLabel(group.moduleKey),
      }))
      .sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel))
  }

  const grouped = new Map()
  rows.forEach(row => {
    const entry = normalizePermissionEntry(
      {
        id: row.id ?? row.permission_id ?? row.permissionId,
        code: row.permission_code ?? row.code ?? row.name ?? row.permission,
        label: row.label ?? row.name,
        description: row.description,
      },
      Number(row.module_id ?? row.moduleId),
    )
    if (!entry.code && entry.id == null) {
      return
    }
    const moduleId = Number(row.module_id ?? row.moduleId)
    const moduleKey = String(
      row.module_key
      ?? row.moduleKey
      ?? row.module
      ?? extractModuleKey(entry.code),
    ).trim().toUpperCase().replace(/\s+/g, '_')
    const groupKey = Number.isFinite(moduleId) ? `id:${moduleId}` : moduleKey
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        moduleKey,
        moduleId: Number.isFinite(moduleId) ? moduleId : null,
        moduleLabel: String(
          row.module_label ?? row.moduleLabel ?? row.module ?? '',
        ).trim() || formatModuleLabel(moduleKey),
        permissions: [],
      })
    }
    grouped.get(groupKey).permissions.push(entry)
  })

  return Array.from(grouped.values())
    .map(group => ({
      ...group,
      permissions: group.permissions.filter(
        (entry, index, list) => list.findIndex(
          item => (item.id != null && item.id === entry.id)
            || (item.code && item.code === entry.code),
        ) === index,
      ),
    }))
    .filter(group => group.permissions.length)
    .sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel))
}
