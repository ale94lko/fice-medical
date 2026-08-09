import {
  addClientClinicalSubTabKeys,
  addClientCareCoordinationSubTabKeys,
  addClientTabKeys,
  storedFileCategories,
  storedFileEntityTypes,
} from 'components/constants.js'
import { labI18nKey } from 'src/utils/lab-i18n.js'

/** Categories offered when uploading from Documents → Attachments. */
export const CLIENT_ATTACHMENT_UPLOAD_CATEGORIES = [
  storedFileCategories.clinicalDocument,
  storedFileCategories.labResult,
  storedFileCategories.prescription,
  storedFileCategories.xray,
  storedFileCategories.consentForm,
  storedFileCategories.insuranceDocument,
  storedFileCategories.generatedDocument,
]

/** Filter options for category (chart-wide). */
export const CLIENT_ATTACHMENT_FILTER_CATEGORIES = [
  ...CLIENT_ATTACHMENT_UPLOAD_CATEGORIES,
  storedFileCategories.clientProfile,
]

export const CLIENT_ATTACHMENT_FILTER_ENTITY_TYPES = [
  storedFileEntityTypes.client,
  storedFileEntityTypes.lab,
  storedFileEntityTypes.referral,
  storedFileEntityTypes.insuranceProfile,
  storedFileEntityTypes.insurance,
  storedFileEntityTypes.clinicalNote,
  storedFileEntityTypes.carePlan,
  storedFileEntityTypes.telehealthSession,
  storedFileEntityTypes.screening,
  storedFileEntityTypes.appointment,
  storedFileEntityTypes.followUp,
]

export function clientFileCategoryI18nKey(category) {
  return labI18nKey('clientFileCategory', category)
}

export function clientFileSourceI18nKey(entityType) {
  return labI18nKey('clientFileSource', entityType)
}

export function formatStoredFileSize(bytes) {
  const size = Number(bytes)
  if (!Number.isFinite(size) || size < 0) {
    return '—'
  }
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} MB`
}

export function storedFileCanPreview(file) {
  const type = String(file?.contentType ?? '').trim().toLowerCase()
  if (!type) {
    return false
  }

  return type.startsWith('image/') || type === 'application/pdf'
}

/**
 * Maps entity_type → client form tab/subtab for Source navigation.
 * Returns null when there is no in-form destination.
 */
export function resolveClientFileSourceNavigation(entityType) {
  const token = String(entityType ?? '').trim().toUpperCase()
  switch (token) {
    case storedFileEntityTypes.lab:
      return {
        tab: addClientTabKeys.clinical,
        subTab: addClientClinicalSubTabKeys.labs,
      }
    case storedFileEntityTypes.clinicalNote:
      return {
        tab: addClientTabKeys.clinical,
        subTab: addClientClinicalSubTabKeys.clinicalNotes,
      }
    case storedFileEntityTypes.carePlan:
      return {
        tab: addClientTabKeys.clinical,
        subTab: addClientClinicalSubTabKeys.carePlans,
      }
    case storedFileEntityTypes.screening:
      return {
        tab: addClientTabKeys.clinical,
        subTab: addClientClinicalSubTabKeys.screenings,
      }
    case storedFileEntityTypes.referral:
      return {
        tab: addClientTabKeys.careCoordination,
        subTab: addClientCareCoordinationSubTabKeys.referrals,
      }
    case storedFileEntityTypes.appointment:
      return {
        tab: addClientTabKeys.careCoordination,
        subTab: addClientCareCoordinationSubTabKeys.appointments,
      }
    case storedFileEntityTypes.followUp:
      return {
        tab: addClientTabKeys.careCoordination,
        subTab: addClientCareCoordinationSubTabKeys.followUps,
      }
    case storedFileEntityTypes.insurance:
    case storedFileEntityTypes.insuranceProfile:
      return {
        tab: addClientTabKeys.insurance,
        subTab: null,
      }
    default:
      return null
  }
}

export function isDocumentsOwnedStoredFile(file) {
  const type = String(file?.entityType ?? '').trim().toUpperCase()

  return !type || type === storedFileEntityTypes.client
}
