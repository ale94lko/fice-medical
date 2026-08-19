import {
  clientFieldKeys as ck,
} from 'components/constants.js'
import { isoDateToUsDateString } from 'src/utils/client-form.js'
import { formatDateTime } from 'src/utils/app-datetime.js'

function trim(value) {
  return String(value ?? '').trim()
}

function displayOrDash(value) {
  const text = trim(value)

  return text || '—'
}

function formatTimestamp(raw) {
  const value = trim(raw)
  if (!value) {
    return ''
  }
  const formatted = formatDateTime(value)
  if (formatted) {
    return formatted
  }

  return isoDateToUsDateString(value.slice(0, 10)) || value
}

function readRawMeta(rawClient, ...keys) {
  const row = rawClient ?? {}
  for (const key of keys) {
    const value = row?.[key]
    if (value != null && String(value).trim()) {
      return value
    }
  }

  return null
}

function field(key, label, value) {
  return {
    key,
    label,
    value: displayOrDash(value),
  }
}

/**
 * Read-only Basic Info panel model for Client Overview (Alt).
 */
export function buildClientOverviewAltBasicInfo(
  form,
  header,
  rawClient = null,
  t,
) {
  const createdRaw = readRawMeta(
    rawClient,
    'created_at',
    'createdAt',
    'created',
  )
  const updatedRaw = readRawMeta(
    rawClient,
    'updated_at',
    'updatedAt',
    'last_updated_at',
    'lastUpdatedAt',
  )
  const updatedBy = displayOrDash(readRawMeta(
    rawClient,
    'updated_by_name',
    'updatedByName',
    'updated_by',
    'updatedBy',
    'last_updated_by',
  ))
  const createdLabel = formatTimestamp(createdRaw) || '—'
  const updatedStamp = formatTimestamp(updatedRaw)
  const lastUpdatedLabel = updatedStamp
    ? (updatedBy !== '—'
      ? t('clientOverviewAltUpdatedBy', {
        date: updatedStamp,
        user: updatedBy,
      })
      : updatedStamp)
    : '—'

  const clinicians = Array.isArray(header?.clinicians)
    ? header.clinicians
    : []

  return {
    personal: [
      {
        key: 'phone',
        label: t('phone'),
        type: 'phones',
        entries: Array.isArray(header?.phones) ? header.phones : [],
        value: displayOrDash(header?.phone),
      },
      {
        key: 'email',
        label: t('email'),
        type: 'emails',
        entries: Array.isArray(header?.emails) ? header.emails : [],
        value: displayOrDash(header?.email),
      },
      field('ssnItin', t('ssnItin'), header?.idNumberMasked),
      field('race', t('race'), header?.race),
      field('ethnicity', t('ethnicity'), header?.ethnicity),
      field('gender', t('gender'), header?.gender),
      field(
        'preferredLanguage',
        t('preferredLanguage'),
        header?.preferredLanguage,
      ),
    ],
    administrative: [
      field(
        'admissionDate',
        t('admissionDate'),
        form?.[ck.admissionDate] || header?.clientSince?.date,
      ),
      {
        key: 'clinicians',
        label: t('clinicians'),
        type: 'clinicians',
        clinicians,
        value: clinicians.length
          ? clinicians.map((item) => item.name).join(', ')
          : '—',
      },
    ],
    footer: {
      created: createdLabel,
      lastUpdated: lastUpdatedLabel,
      recordStatusLabel: displayOrDash(header?.statusLabel),
      recordStatus: trim(form?.[ck.status] || header?.status || 'active'),
    },
  }
}
