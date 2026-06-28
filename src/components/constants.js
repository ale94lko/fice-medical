export const siteBreakpoints = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
}

export const siteBreakpointsPx = {
  XXS: 500,
  MD: 1024,
}

export const drawerMobileMaxPx = 499
export const drawerWidthPx = 228
export const drawerMiniWidthPx = 52

export const clientStatus = {
  CLOSED: 0,
  OPEN: 1,
}

export const clientFieldKeys = {
  id: 'id',
  clientNumber: 'clientNumber',
  firstName: 'firstName',
  middleName: 'middleName',
  lastName: 'lastName',
  prefix: 'prefix',
  suffix: 'suffix',
  gender: 'gender',
  preferredLanguage: 'preferredLanguage',
  race: 'race',
  ethnicity: 'ethnicity',
  age: 'age',
  socialSecurityNumber: 'socialSecurityNumber',
  idNumberMasked: 'idNumberMasked',
  name: 'name',
  email: 'email',
  dob: 'dob',
  clinicians: 'clinicians',
  admissionDate: 'admissionDate',
  ageUnit: 'ageUnit',
  assignedClinician: 'assignedClinician',
  status: 'status',
  photoFileId: 'photoFileId',
  referralSource: 'referralSource',
  referralIntakeDate: 'referralIntakeDate',
  referringProvider: 'referringProvider',
  referringOrganization: 'referringOrganization',
  referralSourceDetails: 'referralSourceDetails',
}

export const userFieldKeys = {
  id: 'id',
  firstName: 'firstName',
  lastName: 'lastName',
  name: 'name',
  email: 'email',
  password: 'password',
  roles: 'roles',
  permissions: 'permissions',
  description: 'description',
  role: 'role',
  status: 'status',
  lastLogin: 'lastLogin',
}

export const userDescriptionMaxLength = 500

export const userListColumnKeys = {
  email: 'email',
  role: 'role',
  status: 'status',
  actions: 'actions',
}

export const userRoleValues = {
  administrator: 'ADMINISTRATOR',
  clinician: 'CLINICIAN',
  staff: 'STAFF',
  billing: 'BILLING',
}

export const userStatusValues = {
  active: 'ACTIVE',
  pending: 'PENDING',
  inactive: 'INACTIVE',
}

export const addClientTabKeys = {
  basic: 'basic',
  contact: 'contact',
  familyMedicalHistory: 'familyMedicalHistory',
  allergies: 'allergies',
  insurance: 'insurance',
  clinical: 'clinical',
  careCoordination: 'careCoordination',
  financials: 'financials',
  documents: 'documents',
}

export const addClientClinicalSubTabKeys = {
  familyHistory: 'familyHistory',
  screenings: 'screenings',
  vitals: 'vitals',
  clinicalNotes: 'clinicalNotes',
  carePlans: 'carePlans',
  labs: 'labs',
}

export const addClientCareCoordinationSubTabKeys = {
  referrals: 'referrals',
  appointments: 'appointments',
  careTeam: 'careTeam',
  authorizations: 'authorizations',
  tasks: 'tasks',
  followUps: 'followUps',
}

export const clientAgeUnitValues = {
  years: 'years',
  months: 'months',
  days: 'days',
}

export const clientCountryDefault = 'United States'

export const clientPhoneTypeValues = {
  home: 'Home',
  work: 'Work',
  mobile: 'Mobile',
  fax: 'Fax',
  pager: 'Pager',
  emergency: 'Emergency',
}

export const clientEmailTypeValues = {
  personal: 'Personal',
  work: 'Work',
  other: 'Other',
  billing: 'Billing',
}

export const clientPreferredCommunicationValues = {
  providerDidNotAsk: 'Provider did not ask',
  patientDeclined: 'Patient declined to specify',
  workPhone: 'Work phone',
  homePhone: 'Home Phone',
  mobilePhone: 'Mobile phone',
  mail: 'Mail',
  email: 'Email',
  pointOfContact: 'Point of Contact',
}

export const clientContactTypeValues = {
  primary: 'Primary Contact',
  emergency: 'Emergency Contact',
  billing: 'Billing Contact',
  legal: 'Legal Representative',
  caregiver: 'Caregiver',
  nextOfKin: 'Next of Kin',
  other: 'Other',
}

export const clientRelationshipTypeValues = {
  parents: 'Parents',
  otherFamily: 'Other Family Member',
  others: 'Others',
}

export const clientContactFieldKeys = {
  addressLine1: 'addressLine1',
  addressLine2: 'addressLine2',
  city: 'city',
  state: 'state',
  county: 'county',
  zipCode: 'zipCode',
  country: 'country',
  phones: 'phones',
  emails: 'emails',
  preferredCommunication: 'preferredCommunication',
  consent: 'consent',
  preferredPointOfContactId: 'preferredPointOfContactId',
  additionalNotes: 'additionalNotes',
  otherContacts: 'otherContacts',
  activeOtherContactId: 'activeOtherContactId',
}

export const clientVitalsPainLevelValues = {
  mild: 'mild',
  moderate: 'moderate',
  severe: 'severe',
}

export const clientFormSections = {
  contact: 'contact',
  familyMedicalHistory: 'familyMedicalHistory',
  allergies: 'allergies',
  insurance: 'insurance',
  vitals: 'vitals',
  labs: 'labs',
  followUps: 'followUps',
}

export const clientInsurancePriorityValues = {
  primary: 'Primary',
  secondary: 'Secondary',
  tertiary: 'Tertiary',
}

export const clientInsuranceTypeValues = {
  commercial: 'Commercial',
  medicare: 'Medicare',
  medicaid: 'Medicaid',
  dualEligible: 'Dual Eligible',
  managedMedicaid: 'Managed Medicaid',
  managedMedicare: 'Managed Medicare',
  workersCompensation: 'Workers Compensation',
  selfPay: 'Self Pay',
  assistanceProgram: 'Assistance Program',
  other: 'Other',
}

export const clientInsuranceStatusValues = {
  active: 'Active',
  inactive: 'Inactive',
  pendingVerification: 'Pending Verification',
  expired: 'Expired',
}

export const clientInsuranceRelationshipValues = {
  self: 'Self',
  spouse: 'Spouse',
  parent: 'Parent',
  child: 'Child',
  guardian: 'Guardian',
  other: 'Other',
}

export const clientInsuranceMaxPayerLength = 150

export const clientInsuranceMaxMemberIdLength = 20
export const clientInsuranceMedicareMemberIdLength = 11
export const clientInsuranceMedicaidRecipientIdLength = 10
export const clientInsuranceGoldenCardMemberIdLength = 8

export const clientInsuranceMaxSubscriberNameLength = 150

export const clientInsuranceMaxCardFileBytes = 5 * 1024 * 1024

export const storedFileMaxBytes = 25 * 1024 * 1024

export const storedFileExtensions = [
  'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'csv',
  'doc', 'docx', 'xls', 'xlsx', 'dcm',
]

export const storedFileMimeTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/dicom',
]

export const storedFileCategories = {
  clientProfile: 'CLIENT_PROFILE',
  clinicianProfile: 'CLINICIAN_PROFILE',
  labResult: 'LAB_RESULT',
  clinicalDocument: 'CLINICAL_DOCUMENT',
  prescription: 'PRESCRIPTION',
  xray: 'XRAY',
  consentForm: 'CONSENT_FORM',
  insuranceDocument: 'INSURANCE_DOCUMENT',
  companyLogo: 'COMPANY_LOGO',
}

export const storedFileStatuses = {
  active: 'ACTIVE',
  deleted: 'DELETED',
}

export const clientProfilePhotoMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

export const clientProfilePhotoMaxBytes = storedFileMaxBytes

export const clientProfilePhotoOutputSize = 512

export const clientProfilePhotoCropViewportSize = 280

export const clientProfilePhotoCropMinZoom = 1

export const clientProfilePhotoCropMaxZoom = 3

export const clientProfilePhotoOutputMime = 'image/jpeg'

export const clientProfilePhotoOutputQuality = 0.92

export const labMaxAttachmentBytes = storedFileMaxBytes

export const labAttachmentMimeTypes = storedFileMimeTypes.filter(type =>
  type.startsWith('application/pdf')
  || type.startsWith('image/')
  || type.startsWith('text/'),
)

export const clientInsuranceCardMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
]

export const clientAllergiesNkaStatus = 'NKA'

export const clientAllergySeverityValues = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
}

export const clientAllergySeverityRank = {
  [clientAllergySeverityValues.mild]: 1,
  [clientAllergySeverityValues.moderate]: 2,
  [clientAllergySeverityValues.severe]: 3,
}

export const clientAllergyMaxNameLength = 100

export const clientAllergyMinStartYear = 1900

export const familyMedicalHistorySelfValue = 'Self'

export const familyMedicalHistoryMaxRelationshipLength = 25

export const familyMedicalHistoryMaxConditionsLength = 500

export const clientFamilyRelationshipValues = {
  self: 'Self',
  father: 'Father',
  mother: 'Mother',
  brother: 'Brother',
  sister: 'Sister',
  son: 'Son',
  daughter: 'Daughter',
  halfBrother: 'Half-brother',
  halfSister: 'Half-sister',
  paternalGrandfather: 'Paternal grandfather',
  paternalGrandmother: 'Paternal grandmother',
  maternalGrandfather: 'Maternal grandfather',
  maternalGrandmother: 'Maternal grandmother',
  uncle: 'Uncle',
  aunt: 'Aunt',
  nephew: 'Nephew',
  niece: 'Niece',
  cousin: 'Cousin',
}

export const clientFamilyRelationshipOptions = Object.values(
  clientFamilyRelationshipValues,
).map(value => ({ label: value, value }))

export const clientAgeUnitOptions = [
  { labelKey: 'ageUnitYears', value: clientAgeUnitValues.years },
  { labelKey: 'ageUnitMonths', value: clientAgeUnitValues.months },
  { labelKey: 'ageUnitDays', value: clientAgeUnitValues.days },
]

export const clientGenderValues = {
  male: 'Male',
  female: 'Female',
  unknown: 'Unknown',
}

export const clientMaxAge = 125

export const clientNameMaxLength = 30
export const otherContactNotesMaxLength = 250

export const clientSuffixMaxLength = 5

/** Suffix dropdown options (empty value = none). */
export const clientSuffixOptions = [
  { labelKey: 'suffixSelect', value: '' },
  { labelKey: 'suffixJr', value: 'Jr.' },
  { labelKey: 'suffixSr', value: 'Sr.' },
  { labelKey: 'suffixII', value: 'II' },
  { labelKey: 'suffixIII', value: 'III' },
  { labelKey: 'suffixMD', value: 'MD' },
  { labelKey: 'suffixRN', value: 'RN' },
  { labelKey: 'suffixDDS', value: 'DDS' },
  { labelKey: 'suffixPhD', value: 'PhD' },
]

export const clientListColumnKeys = {
  clientNumber: 'clientNumber',
  name: 'name',
  email: 'email',
  phones: 'phones',
  dob: 'dob',
  allergies: 'allergies',
  clinicians: 'clinicians',
  admissionDate: 'admissionDate',
  status: 'status',
  actions: 'actions',
}

export const defaultTenant = 'main'

/** Host suffixes where the preceding label is the tenant subdomain. */
export const tenantBaseDomains = ['localhost', 'fice.medical']

export const reservedTenantSubdomains = new Set([
  'www',
  'app',
  'api',
  'admin',
])

export const catalogNames = {
  prefix: 'prefix',
  suffix: 'suffix',
  ageUnit: 'age_unit',
  gender: 'gender',
  language: 'language',
  race: 'race',
  ethnicity: 'ethnicity',
  relationshipType: 'relationship_type',
  contactType: 'contact_type',
  payer: 'payer',
  allergyName: 'allergy_name',
  referralSource: 'referral_source',
}

export const addClientBasicInfoCatalogNames = [
  catalogNames.prefix,
  catalogNames.suffix,
  catalogNames.ageUnit,
  catalogNames.gender,
  catalogNames.language,
  catalogNames.race,
  catalogNames.ethnicity,
  catalogNames.relationshipType,
  catalogNames.contactType,
  catalogNames.payer,
  catalogNames.allergyName,
  catalogNames.referralSource,
]

export const screeningFieldTypes = {
  text: 'text',
  textarea: 'textarea',
  date: 'date',
  number: 'number',
  select: 'select',
  radio: 'radio',
  chips: 'chips',
  yesNo: 'yes_no',
}

export const screeningStatuses = {
  draft: 'draft',
  completed: 'completed',
  cancelled: 'cancelled',
}

export const screeningClinicalKeys = {
  mood: 'mood',
  sleepQuality: 'sleep_quality',
  anxietyLevel: 'anxiety_level',
  gad7: 'gad7',
  phq9: 'phq9',
}

export const screeningMeasurementDirections = {
  higherIsBetter: 'higher_is_better',
  higherIsWorse: 'higher_is_worse',
  neutral: 'neutral',
}

export const labStatuses = {
  draft: 'DRAFT',
  ordered: 'ORDERED',
  collected: 'COLLECTED',
  resulted: 'RESULTED',
  reviewed: 'REVIEWED',
  cancelled: 'CANCELLED',
}

export const labCategories = {
  bloodTest: 'BLOOD_TEST',
  urineTest: 'URINE_TEST',
  imaging: 'IMAGING',
  microbiology: 'MICROBIOLOGY',
  pathology: 'PATHOLOGY',
  genetic: 'GENETIC',
  other: 'OTHER',
}

export const labPriorities = {
  routine: 'routine',
  stat: 'stat',
  urgent: 'urgent',
}

export const labFlags = {
  normal: 'normal',
  low: 'low',
  high: 'high',
  criticalLow: 'critical_low',
  criticalHigh: 'critical_high',
  abnormal: 'abnormal',
}

export const labAbnormalValues = {
  yes: 'yes',
  no: 'no',
}

export const labClinicalKeys = {
  hemoglobin: 'hemoglobin',
  wbc: 'wbc',
  platelets: 'platelets',
  a1c: 'a1c',
}

export const labMaxResultSummaryLength = 500

export const labMaxComponentNotesLength = 255

export const followUpStatuses = {
  scheduled: 'SCHEDULED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  overdue: 'OVERDUE',
}

export const followUpStoredStatuses = {
  scheduled: 'SCHEDULED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}

export const followUpTypeValues = {
  medicationReview: 'MEDICATION_REVIEW',
  referralVerification: 'REFERRAL_VERIFICATION',
  authorizationRenewal: 'AUTHORIZATION_RENEWAL',
  carePlanReview: 'CARE_PLAN_REVIEW',
  labResultsReview: 'LAB_RESULTS_REVIEW',
  appointmentFollowUp: 'APPOINTMENT_FOLLOW_UP',
  generalFollowUp: 'GENERAL_FOLLOW_UP',
}

export const followUpPriorityValues = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  urgent: 'URGENT',
}

export const followUpRelatedToValues = {
  clinicalNote: 'CLINICAL_NOTE',
  referral: 'REFERRAL',
  authorization: 'AUTHORIZATION',
  carePlan: 'CARE_PLAN',
  appointment: 'APPOINTMENT',
  labExam: 'LAB_EXAM',
  medication: 'MEDICATION',
  general: 'GENERAL',
}

export const followUpReminderUnitValues = {
  daysBefore: 'DAYS_BEFORE',
  weeksBefore: 'WEEKS_BEFORE',
}

export const followUpNotesMaxLength = 500

export const carePlanStatuses = {
  active: 'ACTIVE',
  completed: 'COMPLETED',
  archived: 'ARCHIVED',
}

export const clinicalNoteStatuses = {
  draft: 'DRAFT',
  signed: 'SIGNED',
}

export const clinicalNoteSoapMaxLength = 65535

export const carePlanGoalStatuses = {
  inProgress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}

export const carePlanProgressDirections = {
  lowerIsBetter: 'LOWER_IS_BETTER',
  higherIsBetter: 'HIGHER_IS_BETTER',
}

export const carePlanOutcomeSourceTypes = {
  manual: 'MANUAL',
  assessment: 'ASSESSMENT',
  vital: 'VITAL',
  lab: 'LAB',
}

export const carePlanProgressStatuses = {
  measured: 'MEASURED',
  notMeasured: 'NOT_MEASURED',
}

export const carePlanPriorities = {
  low: 'low',
  medium: 'medium',
  high: 'high',
}

export const carePlanNameMaxLength = 255
export const carePlanProblemMaxLength = 255
export const carePlanDescriptionMaxLength = 500
export const carePlanGoalTitleMaxLength = 255
export const carePlanInterventionNotesMaxLength = 300
export const carePlanMeasureNotesMaxLength = 500

export const referralTypes = {
  incoming: 'INCOMING',
  outgoing: 'OUTGOING',
}

export const referralStatuses = {
  received: 'RECEIVED',
  pendingReview: 'PENDING_REVIEW',
  accepted: 'ACCEPTED',
  scheduled: 'SCHEDULED',
  completed: 'COMPLETED',
  declined: 'DECLINED',
  closed: 'CLOSED',
}

export const referralPriorities = {
  routine: 'ROUTINE',
  urgent: 'URGENT',
  stat: 'STAT',
}

export const referralSourceSelfReferredCode = 'SELF_REFERRED'

export const referralIntakeSourceDetailsMaxLength = 500

export const referralSchedulingLabels = {
  appointmentScheduled: 'APPOINTMENT_SCHEDULED',
  needsScheduling: 'NEEDS_SCHEDULING',
  noAppointmentRequired: 'NO_APPOINTMENT_REQUIRED',
}

export const referralTerminalStatuses = new Set([
  referralStatuses.closed,
  referralStatuses.declined,
])

export const referralReasonMaxLength = 500
export const referralNotesMaxLength = 1000
export const referralProviderNameMaxLength = 120
export const referralOrganizationMaxLength = 160
export const referralSpecialtyMaxLength = 80
export const referralDiagnosisMaxLength = 250

export const referralMaxDocumentBytes = storedFileMaxBytes

export const referralDocumentMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/csv',
]

export const referralDocumentExtensions = [
  '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png',
]

export const followUpReminderValueOptions = [
  1, 2, 3, 5, 7, 14, 21, 30,
]

export const permissionNames = {
  viewTenants: 'VIEW_TENANTS',
  addTenants: 'ADD_TENANTS',
  editTenants: 'EDIT_TENANTS',
  deleteTenants: 'DELETE_TENANTS',
  viewTenantsUser: 'VIEW_TENANTS_USER',
  addTenantsUser: 'ADD_TENANTS_USER',
  editTenantsUser: 'EDIT_TENANTS_USER',
  deleteTenantsUser: 'DELETE_TENANTS_USER',
  viewTenantsBilling: 'VIEW_TENANTS_BILLING',
  editTenantsBilling: 'EDIT_TENANTS_BILLING',
  viewTenantData: 'VIEW_TENANT_DATA',
  editTenantData: 'EDIT_TENANT_DATA',
  viewAuditLog: 'VIEW_AUDIT_LOG',
  editAuditLog: 'EDIT_AUDIT_LOG',
  viewActiveTokens: 'VIEW_ACTIVE_TOKENS',
  editActiveTokens: 'EDIT_ACTIVE_TOKENS',
  viewPasswordHistory: 'VIEW_PASSWORD_HISTORY',
  editPasswordHistory: 'EDIT_PASSWORD_HISTORY',
  viewCatalog: 'VIEW_CATALOG',
  editCatalog: 'EDIT_CATALOG',
  viewCatalogItem: 'VIEW_CATALOG_ITEM',
  editCatalogItem: 'EDIT_CATALOG_ITEM',
  addRole: 'ADD_ROLE',
  editRole: 'EDIT_ROLE',
  viewConfig: 'VIEW_CONFIG',
  editConfig: 'EDIT_CONFIG',
  viewModules: 'VIEW_MODULES',
  editModules: 'EDIT_MODULES',
  viewPermissions: 'VIEW_PERMISSIONS',
  editPermissions: 'EDIT_PERMISSIONS',
  viewRoles: 'VIEW_ROLES',
  viewPlans: 'VIEW_PLANS',
  editPlans: 'EDIT_PLANS',
  viewClient: 'VIEW_CLIENT',
  addClient: 'ADD_CLIENT',
  editBasicInfoClient: 'EDIT_BASIC_INFO_CLIENT',
  changeStatusClient: 'CHANGE_STATUS_CLIENT',
  archiveClient: 'ARCHIVE_CLIENT',
  viewClinicians: 'VIEW_CLINICIANS',
  editClinicians: 'EDIT_CLINICIANS',
  viewStaffMembers: 'VIEW_STAFF_MEMBERS',
  editStaffMembers: 'EDIT_STAFF_MEMBERS',
  viewCredentials: 'VIEW_CREDENTIALS',
  editCredentials: 'EDIT_CREDENTIALS',
  viewSubtenants: 'VIEW_SUBTENANTS',
  editSubtenants: 'EDIT_SUBTENANTS',
}

export const clientPermissionNames = {
  viewClient: permissionNames.viewClient,
  addClient: permissionNames.addClient,
  editBasicInfoClient: 'EDIT_BASIC_INFO_CLIENT',
  changeStatusClient: 'CHANGE_STATUS_CLIENT',
  archiveClient: 'ARCHIVE_CLIENT',
  viewContact: 'VIEW_CONTACT',
  editContact: 'EDIT_CONTACT',
  viewAllergies: 'VIEW_ALLERGIES',
  editAllergies: 'EDIT_ALLERGIES',
  viewMedicalHistory: 'VIEW_MEDICAL_HISTORY',
  addMedicalHistory: 'ADD_MEDICAL_HISTORY',
  editMedicalHistory: 'EDIT_MEDICAL_HISTORY',
  deleteMedicalHistory: 'DELETE_MEDICAL_HISTORY',
  viewVitalsClient: 'VIEW_VITALS_CLIENT',
  addVitalsClient: 'ADD_VITALS_CLIENT',
  editVitalsClient: 'EDIT_VITALS_CLIENT',
  viewMedicalNotesClient: 'VIEW_MEDICAL_NOTES_CLIENT',
  addMedicalNotesClient: 'ADD_MEDICAL_NOTES_CLIENT',
  editMedicalNotesClient: 'EDIT_MEDICAL_NOTES_CLIENT',
  deleteMedicalNotesClient: 'DELETE_MEDICAL_NOTES_CLIENT',
  signMedicalNotesClient: 'SIGN_MEDICAL_NOTES_CLIENT',
  viewLabsClient: 'VIEW_LABS_CLIENT',
  addLabsClient: 'ADD_LABS_CLIENT',
  editLabsClient: 'EDIT_LABS_CLIENT',
  deleteLabsClient: 'DELETE_LABS_CLIENT',
  viewScreenings: 'VIEW_SCREENINGS',
  addScreenings: 'ADD_SCREENINGS',
  editScreenings: 'EDIT_SCREENINGS',
  viewTenantData: permissionNames.viewTenantData,
  editTenantData: permissionNames.editTenantData,
  viewFollowUps: 'VIEW_FOLLOW_UPS',
  addFollowUps: 'ADD_FOLLOW_UPS',
  editFollowUps: 'EDIT_FOLLOW_UPS',
  viewCarePlans: 'VIEW_CARE_PLANS',
  addCarePlans: 'ADD_CARE_PLANS',
  editCarePlans: 'EDIT_CARE_PLANS',
  signCarePlans: 'SIGN_CARE_PLANS',
  viewAppointmentSlot: 'VIEW_APPOINTMENT_SLOT',
  bookAppointment: 'BOOK_APPOINTMENT',
  cancelAppointment: 'CANCEL_APPOINTMENT',
  rescheduleAppointment: 'RESCHEDULE_APPOINTMENT',
  manageAppointmentSlots: 'MANAGE_APPOINTMENT_SLOTS',
  viewReferrals: 'VIEW_REFERRALS',
  addReferrals: 'ADD_REFERRALS',
  editReferrals: 'EDIT_REFERRALS',
  deleteReferrals: 'DELETE_REFERRALS',
}

export const appointmentStatuses = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  checkedIn: 'CHECKED_IN',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  noShow: 'NO_SHOW',
  rescheduled: 'RESCHEDULED',
}

export const appointmentSlotStatuses = {
  available: 'AVAILABLE',
}

export const appointmentNotesMaxLength = 250

export const appointmentSlotLookaheadDays = 60

export const appointmentTerminalStatuses = new Set([
  appointmentStatuses.cancelled,
  appointmentStatuses.completed,
  appointmentStatuses.noShow,
])

export const staffStatuses = {
  active: 'active',
  inactive: 'inactive',
  onLeave: 'on_leave',
  terminated: 'terminated',
}

export const staffStaffTypes = {
  all: 'all',
  clinicians: 'clinicians',
  nonClinical: 'non_clinical',
}

export const staffCredentialStatuses = {
  valid: 'valid',
  expiringSoon: 'expiring_soon',
  expired: 'expired',
  missing: 'missing',
}

export const staffEntryPoints = {
  addStaff: 'ADD_STAFF',
  addClinician: 'ADD_CLINICIAN',
}

export const apiPaths = {
  catalogsByNames: '/catalogs/v1/by-names',
  staffList: '/staff/v1',
  staffById: id => `/staff/v1/${encodeURIComponent(String(id ?? '').trim())}`,
  staffStatus: id => `/staff/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/status`,
  staffNpiLookup: '/staff/v1/npi-lookup',
  staffPositionIsClinical: code => `/staff/v1/positions/${encodeURIComponent(
    String(code ?? '').trim(),
  )}/is-clinical`,
  rolesList: '/roles/v1',
  cliniciansList: '/staff/v1',
  clientsList: '/client/v1/list-view',
  clientsSearch: '/client/v1/list-view/search',
  clientsListColumnConfig: '/client/v1/list-view/column-config',
  tenantsUsersList: '/user/v1',
  tenantsUsersCreate: '/user/v1/register',
  tenantUserById: id => `/user/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  tenantRolesByTenantId: tenantId => `/roles/v1/tenant/${
    encodeURIComponent(String(tenantId ?? '').trim())
  }`,
  permissionsForCurrentUser: '/permissions/v1/user/me',
  clientById: id => `/client/v1/${encodeURIComponent(String(id ?? '').trim())}`,
  clientClinicalNotes: id => `/client/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/clinical-notes`,
  clientClinicalNoteById: (clientId, noteId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/clinical-notes/${encodeURIComponent(String(noteId ?? '').trim())}`,
  clientClinicalNoteSign: (clientId, noteId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/clinical-notes/${encodeURIComponent(String(noteId ?? '').trim())}/sign`,
  clientClinicalNoteDownload: (clientId, noteId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/clinical-notes/${encodeURIComponent(String(noteId ?? '').trim())}/download`,
  clientAppointments: id => `/appointments/v1/clients/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  appointmentsList: '/appointments/v1',
  appointmentById: id => `/appointments/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  appointmentTypes: '/appointments/v1/types',
  appointmentClinicians: '/appointments/v1/clinicians',
  appointmentSlots: '/appointments/v1/slots',
  appointmentBook: '/appointments/v1/book',
  appointmentCancel: id => `/appointments/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/cancel`,
  appointmentReschedule: id => `/appointments/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/reschedule`,
  appointmentCheckIn: id => `/appointments/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/check-in`,
  appointmentComplete: id => `/appointments/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/complete`,
  appointmentNoShow: id => `/appointments/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/no-show`,
  clientReferrals: id => `/client/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/referrals`,
  clientReferralById: (clientId, referralId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/referrals/${encodeURIComponent(String(referralId ?? '').trim())}`,
  clientReferralClose: (clientId, referralId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/referrals/${encodeURIComponent(String(referralId ?? '').trim())}/close`,
  clientReferralFiles: (clientId, referralId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/referrals/${encodeURIComponent(String(referralId ?? '').trim())}/files`,
  clientReferralFileDownload: (
    clientId,
    referralId,
    fileId,
  ) => `/client/v1/${encodeURIComponent(String(clientId ?? '').trim())
  }/referrals/${encodeURIComponent(String(referralId ?? '').trim())
  }/files/${encodeURIComponent(String(fileId ?? '').trim())}/download`,
  clientReferralFileById: (
    clientId,
    referralId,
    fileId,
  ) => `/client/v1/${encodeURIComponent(String(clientId ?? '').trim())
  }/referrals/${encodeURIComponent(String(referralId ?? '').trim())
  }/files/${encodeURIComponent(String(fileId ?? '').trim())}`,
  clientCarePlans: id => `/client/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/care-plans`,
  clientCarePlanById: (clientId, planId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/care-plans/${encodeURIComponent(String(planId ?? '').trim())}`,
  clientCarePlanStatus: (clientId, planId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/care-plans/${encodeURIComponent(String(planId ?? '').trim())}/status`,
  clientCarePlanSign: (clientId, planId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/care-plans/${encodeURIComponent(String(planId ?? '').trim())}/sign`,
  clientCarePlanGoals: (clientId, planId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/care-plans/${encodeURIComponent(String(planId ?? '').trim())}/goals`,
  clientCarePlanGoalById: (clientId, planId, goalId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/care-plans/${encodeURIComponent(String(planId ?? '').trim())
  }/goals/${encodeURIComponent(String(goalId ?? '').trim())}`,
  clientCarePlanOutcomeMeasures: (clientId, planId, goalId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/care-plans/${encodeURIComponent(String(planId ?? '').trim())
  }/goals/${encodeURIComponent(String(goalId ?? '').trim())
  }/outcome-measures`,
  clientCarePlanOutcomeMeasureById: (
    clientId,
    planId,
    goalId,
    measureId,
  ) => `/client/v1/${encodeURIComponent(String(clientId ?? '').trim())
  }/care-plans/${encodeURIComponent(String(planId ?? '').trim())
  }/goals/${encodeURIComponent(String(goalId ?? '').trim())
  }/outcome-measures/${encodeURIComponent(String(measureId ?? '').trim())}`,
  clientCarePlanMeasureCurrentValue: (
    clientId,
    planId,
    goalId,
    measureId,
  ) => `/client/v1/${encodeURIComponent(String(clientId ?? '').trim())
  }/care-plans/${encodeURIComponent(String(planId ?? '').trim())
  }/goals/${encodeURIComponent(String(goalId ?? '').trim())
  }/outcome-measures/${encodeURIComponent(String(measureId ?? '').trim())
  }/current-value`,
  clientCarePlanInterventions: (clientId, planId, goalId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/care-plans/${encodeURIComponent(String(planId ?? '').trim())
  }/goals/${encodeURIComponent(String(goalId ?? '').trim())
  }/interventions`,
  clientCarePlanInterventionById: (
    clientId,
    planId,
    goalId,
    interventionId,
  ) => `/client/v1/${encodeURIComponent(String(clientId ?? '').trim())
  }/care-plans/${encodeURIComponent(String(planId ?? '').trim())
  }/goals/${encodeURIComponent(String(goalId ?? '').trim())
  }/interventions/${encodeURIComponent(String(interventionId ?? '').trim())}`,
  clientsCreate: '/client/v1/register',
  clientMatch: '/client/v1/match',
  screeningTemplates: '/screenings/v1/templates',
  screeningTemplateById: id => `/screenings/v1/templates/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  clientScreenings: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/screenings`,
  clientScreeningById: (clientId, screeningId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/screenings/${encodeURIComponent(String(screeningId ?? '').trim())}`,
  clientScreeningAnswers: (clientId, screeningId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/screenings/${encodeURIComponent(String(screeningId ?? '').trim())}/answers`,
  clientScreeningComplete: (clientId, screeningId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/screenings/${
    encodeURIComponent(String(screeningId ?? '').trim())
  }/complete`,
  clientScreeningCancel: (clientId, screeningId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/screenings/${encodeURIComponent(String(screeningId ?? '').trim())}/cancel`,
  clientLabs: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/labs`,
  clientLabById: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}`,
  clientLabDraft: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/draft`,
  clientLabFiles: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/files`,
  clientLabFileDownload: (clientId, labId, fileId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())
  }/files/${encodeURIComponent(String(fileId ?? '').trim())}/download`,
  clientLabFileById: (clientId, labId, fileId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())
  }/files/${encodeURIComponent(String(fileId ?? '').trim())}`,
  storedFilesUpload: '/files/v1/upload',
  storedFilesList: '/files/v1',
  storedFileById: id => `/files/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  storedFileDownload: id => `/files/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/download`,
  storedFilePreview: id => `/files/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/preview`,
  patientLabs: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/labs`,
  patientLabById: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}`,
  patientLabDraft: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/draft`,
  patientLabAttachment: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/files`,
  patientLabAttachmentById: (clientId, labId, fileId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())
  }/files/${encodeURIComponent(String(fileId ?? '').trim())}`,
  oauthLogin: '/oauth/v1/login',
  oauthRefresh: '/oauth/v1/refresh',
  oauthForgotPassword: '/oauth/v1/forgot-password',
  oauthResetPassword: '/oauth/v1/reset-password',
  logout: '/logout',
}

export const authStorageKeys = {
  token: 'token',
  expireAt: 'expireAt',
  expireAtLegacy: 'expiresAt',
  refresh: 'refreshToken',
  refreshLegacy: 'refresh_token',
  modules: 'modules',
  permissions: 'permissions',
  subtenants: 'subtenants',
  activeSubtenantId: 'activeSubtenantId',
  tenantId: 'tenantId',
}

export const appModuleNames = {
  client: 'Client',
  administration: 'Administration',
}

export const typeNames = {
  undefined: 'undefined',
  object: 'object',
  function: 'function',
  string: 'string',
  number: 'number',
}

export const quasarNotifyTypes = {
  positive: 'positive',
  negative: 'negative',
  warning: 'warning',
  info: 'info',
}

export const htmlInputTypes = {
  text: 'text',
  email: 'email',
  password: 'password',
  tel: 'tel',
  textarea: 'textarea',
}
