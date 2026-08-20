export const documentTypes = {
  clientProfile: 'CLIENT_PROFILE',
  userProfile: 'USER_PROFILE',
  staffProfile: 'STAFF_PROFILE',
  carePlan: 'CARE_PLAN',
  clinicalNote: 'CLINICAL_NOTE',
  appointmentSummary: 'APPOINTMENT_SUMMARY',
  screeningReport: 'SCREENING_REPORT',
}

/** Client overview Generate document menu (order matters). */
export const clientOverviewGenerateDocumentOptions = [
  {
    documentType: documentTypes.clientProfile,
    labelKey: 'generateDocumentFaceSheet',
  },
]

export const documentEntityTypes = {
  [documentTypes.clientProfile]: 'CLIENT',
  [documentTypes.userProfile]: 'TENANT_USER',
  [documentTypes.staffProfile]: 'STAFF_MEMBER',
  [documentTypes.carePlan]: 'CARE_PLAN',
  [documentTypes.clinicalNote]: 'CLINICAL_NOTE',
  [documentTypes.appointmentSummary]: 'APPOINTMENT',
  [documentTypes.screeningReport]: 'SCREENING',
}

export const documentContextFields = {
  [documentTypes.clientProfile]: ['clientNumber'],
  [documentTypes.userProfile]: ['userId'],
  [documentTypes.staffProfile]: ['staffId'],
  [documentTypes.carePlan]: ['clientNumber', 'carePlanId'],
  [documentTypes.clinicalNote]: ['clientNumber', 'clinicalNoteId'],
  [documentTypes.appointmentSummary]: ['appointmentId'],
  [documentTypes.screeningReport]: ['clientNumber', 'screeningId'],
}

export const documentFormatOptions = [
  'PDF',
  'CSV',
  'TXT',
  'XLSX',
  'XML',
  'JSON',
]

export function resolveDocumentEntityType(documentType) {
  return documentEntityTypes[documentType] ?? null
}
