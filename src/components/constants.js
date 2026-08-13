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
  createdAt: 'createdAt',
}

export const userDescriptionMaxLength = 500

export const userListColumnKeys = {
  user: 'user',
  roles: 'roles',
  status: 'status',
  lastLogin: 'lastLogin',
  createdAt: 'createdAt',
  actions: 'actions',
  email: 'email',
  role: 'role',
}

export const subtenantStatusValues = {
  active: 1,
  inactive: 0,
}

export const subtenantFieldKeys = {
  id: 'id',
  name: 'name',
  code: 'code',
  main: 'main',
  status: 'status',
}

export const subtenantListColumnKeys = {
  name: 'name',
  code: 'code',
  main: 'main',
  status: 'status',
  actions: 'actions',
}

export const serviceProcedureStatusValues = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
}

export const serviceProcedureCategoryValues = {
  clinicalService: 'CLINICAL_SERVICE',
  therapy: 'THERAPY',
  evaluation: 'EVALUATION',
  medicationManagement: 'MEDICATION_MANAGEMENT',
  labExam: 'LAB_EXAM',
  procedure: 'PROCEDURE',
  other: 'OTHER',
}

export const authorizationRequirementValues = {
  unknown: 'UNKNOWN',
  mayBeRequired: 'MAY_BE_REQUIRED',
  typicallyRequired: 'TYPICALLY_REQUIRED',
  notUsuallyRequired: 'NOT_USUALLY_REQUIRED',
}

export const serviceProcedureFieldKeys = {
  id: 'id',
  name: 'name',
  category: 'category',
  description: 'description',
  status: 'status',
  minDurationMin: 'minDurationMin',
  maxDurationMin: 'maxDurationMin',
  requiresAppointment: 'requiresAppointment',
  cptCode: 'cptCode',
  hcpcsCode: 'hcpcsCode',
  defaultFee: 'defaultFee',
  authorizationRequirement: 'authorizationRequirement',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
}

export const serviceProcedureListColumnKeys = {
  name: 'name',
  category: 'category',
  duration: 'duration',
  requiresAppointment: 'requiresAppointment',
  codes: 'codes',
  status: 'status',
  actions: 'actions',
}

export const appointmentBookingMaxServices = 3

export const placeOfServiceStatusValues = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
}

export const appointmentRecurrenceFrequencyValues = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
}

export const appointmentRecurrenceEndTypeValues = {
  afterCount: 'AFTER_COUNT',
  onDate: 'ON_DATE',
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
  appointments: 'appointments',
  encounters: 'encounters',
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
  medications: 'medications',
}

export const addClientCareCoordinationSubTabKeys = {
  referrals: 'referrals',
  appointments: 'appointments',
  careTeam: 'careTeam',
  authorizations: 'authorizations',
  tasks: 'tasks',
  followUps: 'followUps',
}

export const addClientDocumentsSubTabKeys = {
  attachments: 'attachments',
  consents: 'consents',
  signedForms: 'signedForms',
}

/** entity_type values used with stored_file (Source column). */
export const storedFileEntityTypes = {
  lab: 'LAB',
  referral: 'REFERRAL',
  insuranceProfile: 'INSURANCE_PROFILE',
  insurance: 'INSURANCE',
  telehealthSession: 'TELEHEALTH_SESSION',
  client: 'CLIENT',
  carePlan: 'CARE_PLAN',
  clinicalNote: 'CLINICAL_NOTE',
  screening: 'SCREENING',
  appointment: 'APPOINTMENT',
  followUp: 'FOLLOW_UP',
  staffMember: 'STAFF_MEMBER',
}

export const consentTypeValues = {
  treatment: 'TREATMENT',
  telehealth: 'TELEHEALTH',
  releaseOfInformation: 'RELEASE_OF_INFORMATION',
  privacy: 'PRIVACY',
  communication: 'COMMUNICATION',
  financial: 'FINANCIAL',
  other: 'OTHER',
}

export const consentVersionStatusValues = {
  draft: 'DRAFT',
  published: 'PUBLISHED',
  archived: 'ARCHIVED',
}

export const consentStatusValues = {
  pendingSignature: 'PENDING_SIGNATURE',
  accepted: 'ACCEPTED',
  declined: 'DECLINED',
  revoked: 'REVOKED',
  expired: 'EXPIRED',
  cancelled: 'CANCELLED',
}

export const consentSignerTypeValues = {
  client: 'CLIENT',
  guardian: 'GUARDIAN',
  authorizedRepresentative: 'AUTHORIZED_REPRESENTATIVE',
}

export const consentSignatureMethodValues = {
  inPersonDigital: 'IN_PERSON_DIGITAL',
  inPersonPaper: 'IN_PERSON_PAPER',
  clientPortal: 'CLIENT_PORTAL',
  secureLink: 'SECURE_LINK',
  other: 'OTHER',
}

export const consentNameMaxLength = 200
export const consentDescriptionMaxLength = 1000
export const consentRevocationReasonMaxLength = 500
export const consentRelationshipMaxLength = 120
export const consentSignerNameMaxLength = 200


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
  patientDeclined: 'Client declined to specify',
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
  guardian: 'Guardian',
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
  ACTIVE: 'Active',
  FUTURE: 'Future',
  EXPIRED: 'Expired',
  INACTIVE: 'Inactive',
}

/** Catalog codes for insurance deactivate reason (API body `reason`). */
export const insuranceDeactivationReasonOtherCode = 'OTHER'

/** Fallback labels when catalog is unavailable. */
export const insuranceDeactivationReasonFallbackLabels = {
  COVERAGE_TERMINATED: 'Coverage Terminated',
  CHANGED_INSURANCE: 'Changed Insurance',
  DUPLICATE_INSURANCE: 'Duplicate Insurance',
  ENTERED_BY_MISTAKE: 'Entered by Mistake',
  OTHER: 'Other',
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
  userProfile: 'USER_PROFILE',
  labResult: 'LAB_RESULT',
  clinicalDocument: 'CLINICAL_DOCUMENT',
  prescription: 'PRESCRIPTION',
  xray: 'XRAY',
  consentForm: 'CONSENT_FORM',
  insuranceDocument: 'INSURANCE_DOCUMENT',
  generatedDocument: 'GENERATED_DOCUMENT',
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

/** Paper consent scan: PDF or image (signed form upload). */
export const consentPaperScanExtensions = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
]

export const consentPaperScanMimeTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]

/** Extensions allowed for lab attachments (aligned with mime filter). */
export const labAttachmentExtensions = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'txt',
  'csv',
]

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
  resourceCategory: 'resource_category',
  dosageUnit: 'dosage_unit',
  medicationRoute: 'medication_route',
  medicationFrequency: 'medication_frequency',
  insuranceDeactivationReason: 'insurance_deactivation_reason',
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

export const medicationStatuses = {
  active: 'ACTIVE',
  discontinued: 'DISCONTINUED',
  completed: 'COMPLETED',
}

export const pharmacyModeValues = {
  preferred: 'PREFERRED',
  selected: 'SELECTED',
  none: 'NONE',
}

export const pharmacyNameMaxLength = 160
export const pharmacyPhoneMaxLength = 30
export const pharmacyFaxMaxLength = 30
export const pharmacyAddressMaxLength = 200
export const pharmacyCityMaxLength = 100
export const pharmacyZipMaxLength = 12
export const pharmacyNotesMaxLength = 500

export const medicationConsentNotesMaxLength = 500

export const screeningTemplateStatusValues = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  archived: 'ARCHIVED',
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
  routine: 'ROUTINE',
  stat: 'STAT',
  urgent: 'URGENT',
}

export const labFlags = {
  normal: 'NORMAL',
  low: 'LOW',
  high: 'HIGH',
  criticalLow: 'CRITICAL_LOW',
  criticalHigh: 'CRITICAL_HIGH',
  abnormal: 'ABNORMAL',
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
export const carePlanProblemListDisplayMaxLength = 100
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
  viewClinicalAudit: 'VIEW_CLINICAL_AUDIT',
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
  generateDocuments: 'GENERATE_DOCUMENTS',
  viewFiles: 'VIEW_FILES',
  uploadFiles: 'UPLOAD_FILES',
  deleteFiles: 'DELETE_FILES',
  manageScreeningTemplates: 'MANAGE_SCREENING_TEMPLATES',
  viewClinicalResources: 'VIEW_CLINICAL_RESOURCES',
  manageClinicalResources: 'MANAGE_CLINICAL_RESOURCES',
  viewReferenceData: 'VIEW_REFERENCE_DATA',
  consentView: 'CONSENT_VIEW',
  consentCreate: 'CONSENT_CREATE',
  consentEdit: 'CONSENT_EDIT',
  consentPublish: 'CONSENT_PUBLISH',
  consentAssign: 'CONSENT_ASSIGN',
  consentSign: 'CONSENT_SIGN',
  consentRevoke: 'CONSENT_REVOKE',
  consentDelete: 'CONSENT_DELETE',
  consentDownload: 'CONSENT_DOWNLOAD',
  consentAuditView: 'CONSENT_AUDIT_VIEW',
  viewEncounter: 'VIEW_ENCOUNTER',
  manageEncounter: 'MANAGE_ENCOUNTER',
  startEncounter: 'START_ENCOUNTER',
  manageServiceRequirements: 'MANAGE_SERVICE_REQUIREMENTS',
  useAiClinicalSummary: 'USE_AI_CLINICAL_SUMMARY',
  useAiScribe: 'USE_AI_SCRIBE',
  useAiCodingAssistant: 'USE_AI_CODING_ASSISTANT',
  useAiCarePlanDraft: 'USE_AI_CARE_PLAN_DRAFT',
  useAiMissingInfo: 'USE_AI_MISSING_INFO',
  manageAiConfig: 'MANAGE_AI_CONFIG',
  manageAiSuggestion: 'MANAGE_AI_SUGGESTION',
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
  viewFiles: permissionNames.viewFiles,
  uploadFiles: permissionNames.uploadFiles,
  deleteFiles: permissionNames.deleteFiles,
  consentView: permissionNames.consentView,
  consentCreate: permissionNames.consentCreate,
  consentEdit: permissionNames.consentEdit,
  consentPublish: permissionNames.consentPublish,
  consentAssign: permissionNames.consentAssign,
  consentSign: permissionNames.consentSign,
  consentRevoke: permissionNames.consentRevoke,
  consentDelete: permissionNames.consentDelete,
  consentDownload: permissionNames.consentDownload,
  consentAuditView: permissionNames.consentAuditView,
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
  viewMedications: 'VIEW_MEDICATIONS',
  addMedications: 'ADD_MEDICATIONS',
  editMedications: 'EDIT_MEDICATIONS',
  deleteMedications: 'DELETE_MEDICATIONS',
  viewPharmacies: 'VIEW_PHARMACIES',
  addPharmacies: 'ADD_PHARMACIES',
  editPharmacies: 'EDIT_PHARMACIES',
  deletePharmacies: 'DELETE_PHARMACIES',
  viewTelehealth: 'VIEW_TELEHEALTH',
  createTelehealth: 'CREATE_TELEHEALTH',
  manageTelehealth: 'MANAGE_TELEHEALTH',
  joinTelehealth: 'JOIN_TELEHEALTH',
  admitTelehealth: 'ADMIT_TELEHEALTH',
  startTelehealth: 'START_TELEHEALTH',
  finishTelehealth: 'FINISH_TELEHEALTH',
  chatTelehealth: 'CHAT_TELEHEALTH',
  uploadTelehealthFiles: 'UPLOAD_TELEHEALTH_FILES',
  deleteTelehealthFiles: 'DELETE_TELEHEALTH_FILES',
  viewEncounter: 'VIEW_ENCOUNTER',
  manageEncounter: 'MANAGE_ENCOUNTER',
  startEncounter: permissionNames.startEncounter,
  manageServiceRequirements: permissionNames.manageServiceRequirements,
  useAiClinicalSummary: permissionNames.useAiClinicalSummary,
  useAiScribe: permissionNames.useAiScribe,
  useAiCodingAssistant: permissionNames.useAiCodingAssistant,
  useAiCarePlanDraft: permissionNames.useAiCarePlanDraft,
  useAiMissingInfo: permissionNames.useAiMissingInfo,
  manageAiConfig: permissionNames.manageAiConfig,
  manageAiSuggestion: permissionNames.manageAiSuggestion,
}

export const aiFeatures = {
  clinicalSummary: 'CLINICAL_SUMMARY',
  soapDraft: 'SOAP_DRAFT',
  icd10Suggest: 'ICD10_SUGGEST',
  carePlanDraft: 'CARE_PLAN_DRAFT',
}

export const aiSuggestionStatuses = {
  pending: 'PENDING',
  edited: 'EDITED',
  partiallyAccepted: 'PARTIALLY_ACCEPTED',
  accepted: 'ACCEPTED',
  rejected: 'REJECTED',
  failed: 'FAILED',
  expired: 'EXPIRED',
}

export const aiClinicalSummaryScopes = {
  faceSheetLite: 'FACE_SHEET_LITE',
  currentEncounter: 'CURRENT_ENCOUNTER',
  recentHistory: 'RECENT_HISTORY',
}

export const aiCarePlanModes = {
  new: 'NEW',
  extendActive: 'EXTEND_ACTIVE',
}

export const aiCarePlanProblemModes = {
  single: 'SINGLE',
  multi: 'MULTI',
}

export const aiGenerateTimeoutMs = 60000

export const encounterStatuses = {
  inProgress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}

export const encounterCancelReasons = {
  startedByMistake: 'STARTED_BY_MISTAKE',
  wrongPatient: 'WRONG_PATIENT',
  duplicateEncounter: 'DUPLICATE_ENCOUNTER',
  patientLeft: 'PATIENT_LEFT',
  technicalIssue: 'TECHNICAL_ISSUE',
  other: 'OTHER',
}

export const encounterBillingReadinessStatuses = {
  notReady: 'NOT_READY',
  ready: 'READY',
  billed: 'BILLED',
}

export const encounterWorkspaceTabs = {
  overview: 'overview',
  visit: 'visit',
  clinical: 'clinical',
  note: 'note',
  followUp: 'follow-up',
}

export const encounterClinicalSubTabs = {
  vitals: 'vitals',
  assessments: 'assessments',
  medications: 'medications',
  carePlans: 'care-plans',
  labs: 'labs',
}

export const encounterRequirementPurposes = {
  encounterCompletion: 'ENCOUNTER_COMPLETION',
  billingReadiness: 'BILLING_READINESS',
}

export const encounterRequirementStatuses = {
  pending: 'PENDING',
  satisfied: 'SATISFIED',
  waived: 'WAIVED',
  inactive: 'INACTIVE',
}

export const encounterRequirementScopes = {
  encounter: 'ENCOUNTER',
  service: 'SERVICE',
}

export const encounterRequirementSeverities = {
  blocking: 'BLOCKING',
  warning: 'WARNING',
}

export const encounterRequirementTypes = {
  vitals: 'VITALS',
  note: 'NOTE',
  assessment: 'ASSESSMENT',
  form: 'FORM',
  safetyAssessment: 'SAFETY_ASSESSMENT',
  medicationReview: 'MEDICATION_REVIEW',
  carePlanReview: 'CARE_PLAN_REVIEW',
  diagnosis: 'DIAGNOSIS',
  service: 'SERVICE',
}

export const encounterRequirementActionTypes = {
  openVitals: 'OPEN_VITALS',
  openNote: 'OPEN_NOTE',
  openAssessment: 'OPEN_ASSESSMENT',
  openForm: 'OPEN_FORM',
  openSafetyAssessment: 'OPEN_SAFETY_ASSESSMENT',
  openMedicationReview: 'OPEN_MEDICATION_REVIEW',
  openCarePlanReview: 'OPEN_CARE_PLAN_REVIEW',
}

export const encounterTypes = {
  walkIn: 'WALK_IN',
  phone: 'PHONE',
  telehealth: 'TELEHEALTH',
  scheduled: 'SCHEDULED',
}

export const telehealthSessionStatuses = {
  scheduled: 'SCHEDULED',
  waitingRoom: 'WAITING_ROOM',
  ready: 'READY',
  inProgress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  failed: 'FAILED',
}

export const telehealthParticipantStatuses = {
  waiting: 'WAITING',
  admitted: 'ADMITTED',
  inSession: 'IN_SESSION',
  left: 'LEFT',
}

export const telehealthRoles = {
  clinician: 'CLINICIAN',
  client: 'CLIENT',
  guest: 'GUEST',
}

export const telehealthChatMessageTypes = {
  text: 'TEXT',
  system: 'SYSTEM',
  join: 'JOIN',
  leave: 'LEAVE',
}

export const telehealthFileCategories = {
  clinicalDocument: 'CLINICAL_DOCUMENT',
  labResult: 'LAB_RESULT',
  prescription: 'PRESCRIPTION',
  xray: 'XRAY',
  consentForm: 'CONSENT_FORM',
}

export const telehealthHeartbeatIntervalMs = 30000

export const telehealthChatBodyMaxLength = 4000

export const appointmentStatuses = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  checkedIn: 'CHECKED_IN',
  inProgress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  noShow: 'NO_SHOW',
  rescheduled: 'RESCHEDULED',
}

export const appointmentNotesMaxLength = 250

export const appointmentSlotLookaheadDays = 60

export const appointmentAvailabilityPickerModes = {
  ranges: 'ranges',
  slots: 'slots',
}

export const appointmentAvailabilityPickerDefaultMode =
  appointmentAvailabilityPickerModes.ranges

export const appointmentAvailabilityRangesLimit = 500

export const appointmentAvailabilityBlockTypes = {
  outside: 'outside',
  break: 'break',
  appointment: 'appointment',
  available: 'available',
}

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

export const clinicalResourceTypeValues = {
  externalLink: 'ExternalLink',
  document: 'Document',
}

export const clinicalResourceStatusValues = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  archived: 'ARCHIVED',
}

export const clinicalResourcePinnedMax = 5

/** Max visible characters for resource title in list tables. */
export const clinicalResourceTitleMaxChars = 50

/** Max visible characters for resource URL in list tables. */
export const clinicalResourceUrlMaxChars = 60

export const clinicalResourcePinRoleNames = {
  tenantAdmin: 'TENANT_ADMIN',
  superAdmin: 'SUPER_ADMIN',
}

export const clinicalResourceFieldKeys = {
  title: 'title',
  category: 'category',
  type: 'type',
  keywords: 'keywords',
  content: 'content',
  url: 'url',
  status: 'status',
  pinned: 'pinned',
  favorite: 'favorite',
  updatedAt: 'updatedAt',
}

export const clinicalResourceListColumnKeys = {
  title: 'title',
  category: 'category',
  type: 'type',
  status: 'status',
  updatedAt: 'updatedAt',
  pinned: 'pinned',
  favorite: 'favorite',
  actions: 'actions',
}

export const clinicalResourceDocumentExtensions = [
  '.pdf', '.doc', '.docx', '.txt', '.rtf',
  '.png', '.jpg', '.jpeg',
]

export const clinicalResourceDocumentMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
  'text/rtf',
  'image/png',
  'image/jpeg',
  'image/jpg',
]

export const apiPaths = {
  catalogsByNames: '/catalogs/v1/by-names',
  dashboard: '/dashboard/v1',
  dashboardConfig: '/dashboard/v1/config',
  staffList: '/staff/v1',
  staffWithoutSystemUser: '/staff/v1/without-system-user',
  staffById: id => `/staff/v1/${encodeURIComponent(String(id ?? '').trim())}`,
  staffStatus: id => `/staff/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/status`,
  staffNpiLookup: '/staff/v1/npi-lookup',
  staffPositionIsClinical: code => `/staff/v1/positions/${encodeURIComponent(
    String(code ?? '').trim(),
  )}/is-clinical`,
  providerTaxonomies: '/reference-data/v1/taxonomies',
  providerTaxonomyByCode: code => `/reference-data/v1/taxonomies/${
    encodeURIComponent(String(code ?? '').trim())
  }`,
  rolesList: '/roles/v1',
  cliniciansList: '/staff/v1/clinicians',
  clientsList: '/client/v1/list-view',
  clientsSearch: '/client/v1/list-view/search',
  clientsListColumnConfig: '/client/v1/list-view/column-config',
  tenantsUsersList: '/user/v1',
  tenantsUsersCreate: '/user/v1/register',
  tenantUserById: id => `/user/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  subtenantsList: '/subtenants/v1',
  subtenantById: id => `/subtenants/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  clinicalAuditList: '/clinical-audit/v1',
  clinicalAuditById: id => `/clinical-audit/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  serviceProceduresList: '/service-procedures/v1',
  serviceProcedureById: id => `/service-procedures/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  serviceProcedureStatus: id => `/service-procedures/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/status`,
  tenantServiceProceduresList: '/tenant/service-procedures/v1',
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
  clientAppointmentsSearch: id => `/appointments/v1/clients/${
    encodeURIComponent(String(id ?? '').trim())
  }/search`,
  appointmentsList: '/appointments/v1',
  appointmentById: id => `/appointments/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  appointmentServiceProcedures: '/appointments/v1/service-procedures',
  appointmentDurationPreview:
    '/appointments/v1/service-procedures/duration-preview',
  appointmentAvailability: '/appointments/v1/availability',
  appointmentAvailabilityRanges: '/appointments/v1/availability/ranges',
  appointmentPlacesOfService: '/appointments/v1/places-of-service',
  placesOfServiceList: '/places-of-service/v1',
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
  appointmentEncounterStart: id => `/appointments/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/encounter/start`,
  encountersCreate: '/encounters/v1',
  clientEncounters: clientId => `/encounters/v1/clients/${
    encodeURIComponent(String(clientId ?? '').trim())
  }`,
  clientEncounterStart: clientId => `/encounters/v1/clients/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/start`,
  clientActiveEncounter: clientId => `/encounters/v1/clients/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/active`,
  encounterById: id => `/encounters/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  encounterWorkspace: id => `/encounters/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/workspace`,
  encounterRequirements: id => `/encounters/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/requirements`,
  encounterRequirementsRecalculate: id => `/encounters/v1/${
    encodeURIComponent(String(id ?? '').trim())
  }/requirements/recalculate`,
  encounterRequirementWaive: (id, requirementId) => `/encounters/v1/${
    encodeURIComponent(String(id ?? '').trim())
  }/requirements/${encodeURIComponent(String(requirementId ?? '').trim())
  }/waive`,
  encounterMedicationReviews: id => `/encounters/v1/${
    encodeURIComponent(String(id ?? '').trim())
  }/medication-reviews`,
  encounterCarePlanReviews: id => `/encounters/v1/${
    encodeURIComponent(String(id ?? '').trim())
  }/care-plan-reviews`,
  encounterComplete: id => `/encounters/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/complete`,
  encounterCancel: id => `/encounters/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/cancel`,
  encounterReopen: id => `/encounters/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/reopen`,
  serviceProcedureRequirements: id => `/service-procedures/v1/${
    encodeURIComponent(String(id ?? '').trim())
  }/requirements`,
  serviceProcedureRequirementById: (id, requirementId) =>
    `/service-procedures/v1/${
      encodeURIComponent(String(id ?? '').trim())
    }/requirements/${
      encodeURIComponent(String(requirementId ?? '').trim())
    }`,
  aiConfig: '/ai/v1/config',
  aiSuggestionById: id => `/ai/v1/suggestions/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  aiSuggestionAccept: id => `/ai/v1/suggestions/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/accept`,
  aiSuggestionReject: id => `/ai/v1/suggestions/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/reject`,
  aiClinicalSummary: clientId => `/ai/v1/clients/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/clinical-summary`,
  aiSoapDraft: encounterId => `/ai/v1/encounters/${encodeURIComponent(
    String(encounterId ?? '').trim(),
  )}/soap-draft`,
  aiSuggestIcd10: encounterId => `/ai/v1/encounters/${encodeURIComponent(
    String(encounterId ?? '').trim(),
  )}/suggest-icd10`,
  aiCarePlanDraft: clientId => `/ai/v1/clients/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/care-plan-draft`,
  clinicianWeeklySchedule: id => `/appointments/v1/admin/clinicians/${
    encodeURIComponent(String(id ?? '').trim())
  }/weekly-schedule`,
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
  screeningTemplatesManage: '/screenings/v1/templates/manage',
  screeningTemplateManageById: id => `/screenings/v1/templates/${
    encodeURIComponent(String(id ?? '').trim())
  }/manage`,
  screeningTemplateStatus: id => `/screenings/v1/templates/${
    encodeURIComponent(String(id ?? '').trim())
  }/status`,
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
  clientMedications: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/medications`,
  clientMedicationById: (clientId, medicationId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/medications/${encodeURIComponent(String(medicationId ?? '').trim())}`,
  clientMedicationStatus: (clientId, medicationId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/medications/${
    encodeURIComponent(String(medicationId ?? '').trim())
  }/status`,
  clientPharmacies: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/pharmacies`,
  clientPharmacyById: (clientId, pharmacyId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/pharmacies/${encodeURIComponent(String(pharmacyId ?? '').trim())}`,
  clientPharmacySetPreferred: (clientId, pharmacyId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/pharmacies/${
    encodeURIComponent(String(pharmacyId ?? '').trim())
  }/set-preferred`,
  clientPrescriptionConsent: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/prescription-consent`,
  referenceMedications: '/reference-data/v1/medications',
  referenceMedicationById: id => `/reference-data/v1/medications/${
    encodeURIComponent(String(id ?? '').trim())
  }`,
  referenceIcd10Cm: '/reference-data/v1/icd10-cm',
  referenceIcd10CmById: id => `/reference-data/v1/icd10-cm/${
    encodeURIComponent(String(id ?? '').trim())
  }`,
  // Meet REST (JWT staff + public guest). SockJS stays at /telehealth.
  telehealthSessions: '/meet/v1/sessions',
  telehealthSession: id => `/meet/v1/sessions/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  telehealthSessionJoin: id => `/meet/v1/sessions/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/join`,
  telehealthSessionLeave: id => `/meet/v1/sessions/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/leave`,
  telehealthWaitingRoomReady: id => `/meet/v1/sessions/${
    encodeURIComponent(String(id ?? '').trim())
  }/waiting-room/ready`,
  telehealthSessionAdmit: id => `/meet/v1/sessions/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/admit`,
  telehealthSessionStart: id => `/meet/v1/sessions/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/start`,
  telehealthSessionFinish: id => `/meet/v1/sessions/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/finish`,
  telehealthSessionParticipants: id => `/meet/v1/sessions/${
    encodeURIComponent(String(id ?? '').trim())
  }/participants`,
  telehealthSessionHeartbeat: id => `/meet/v1/sessions/${
    encodeURIComponent(String(id ?? '').trim())
  }/heartbeat`,
  telehealthSessionChat: id => `/meet/v1/sessions/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/chat`,
  telehealthSessionChatMessage: (id, messageId) => `/meet/v1/sessions/${
    encodeURIComponent(String(id ?? '').trim())
  }/chat/${encodeURIComponent(String(messageId ?? '').trim())}`,
  telehealthSessionFiles: id => `/meet/v1/sessions/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/files`,
  telehealthSessionFileById: (id, fileId) => `/meet/v1/sessions/${
    encodeURIComponent(String(id ?? '').trim())
  }/files/${encodeURIComponent(String(fileId ?? '').trim())}`,
  telehealthSessionFileDownload: (id, fileId) => `/meet/v1/sessions/${
    encodeURIComponent(String(id ?? '').trim())
  }/files/${encodeURIComponent(String(fileId ?? '').trim())}/download`,
  telehealthScreenShareStart: id => `/meet/v1/sessions/${
    encodeURIComponent(String(id ?? '').trim())
  }/screen-share/start`,
  telehealthScreenShareStop: id => `/meet/v1/sessions/${
    encodeURIComponent(String(id ?? '').trim())
  }/screen-share/stop`,
  telehealthSessionResendInvite: id => `/meet/v1/sessions/${
    encodeURIComponent(String(id ?? '').trim())
  }/resend-invite`,
  telehealthPublicJoin: '/meet/v1/public/join',
  telehealthPublicLobby: '/meet/v1/public/lobby',
  telehealthPublicSession: '/meet/v1/public/session',
  telehealthPublicWaitingReady: '/meet/v1/public/waiting-room/ready',
  telehealthPublicHeartbeat: '/meet/v1/public/heartbeat',
  telehealthPublicLeave: '/meet/v1/public/leave',
  telehealthPublicChat: '/meet/v1/public/chat',
  telehealthPublicChatSend: '/meet/v1/public/chat/send',
  // SockJS + STOMP only (HTTP URL; probes GET /telehealth/info).
  telehealthSockJs: '/telehealth',
  clientLabs: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/labs`,
  clientLabById: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}`,
  clientVitals: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/vitals`,
  clientVitalById: (clientId, vitalId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/vitals/${encodeURIComponent(String(vitalId ?? '').trim())}`,
  clientInsuranceProfileDeactivate: (clientId, profileId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/insurance-profiles/${encodeURIComponent(
    String(profileId ?? '').trim(),
  )}/deactivate`,
  clientInsuranceProfileReactivate: (clientId, profileId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/insurance-profiles/${encodeURIComponent(
    String(profileId ?? '').trim(),
  )}/reactivate`,
  clientLabCollect: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/collect`,
  clientLabResults: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/results`,
  clientLabReview: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/review`,
  clientLabCancel: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/cancel`,
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
  clientFiles: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/files`,
  consentTemplates: '/consents/v1/templates',
  consentTemplateById: id => `/consents/v1/templates/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  consentTemplateVersions: id => `/consents/v1/templates/${
    encodeURIComponent(String(id ?? '').trim())
  }/versions`,
  consentVersionById: (templateId, versionId) => `/consents/v1/templates/${
    encodeURIComponent(String(templateId ?? '').trim())
  }/versions/${encodeURIComponent(String(versionId ?? '').trim())}`,
  consentVersionPublish: (templateId, versionId) => `/consents/v1/templates/${
    encodeURIComponent(String(templateId ?? '').trim())
  }/versions/${encodeURIComponent(String(versionId ?? '').trim())}/publish`,
  clientConsents: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/consents`,
  clientConsentById: (clientId, consentId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/consents/${encodeURIComponent(String(consentId ?? '').trim())}`,
  clientConsentSign: (clientId, consentId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/consents/${encodeURIComponent(String(consentId ?? '').trim())}/sign`,
  clientConsentDecline: (clientId, consentId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/consents/${encodeURIComponent(String(consentId ?? '').trim())}/decline`,
  clientConsentRevoke: (clientId, consentId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/consents/${encodeURIComponent(String(consentId ?? '').trim())}/revoke`,
  clientConsentCancel: (clientId, consentId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/consents/${encodeURIComponent(String(consentId ?? '').trim())}/cancel`,
  clientConsentSecureLink: (clientId, consentId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/consents/${encodeURIComponent(String(consentId ?? '').trim())
  }/secure-link`,
  clientConsentDocumentDownload: (clientId, consentId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/consents/${encodeURIComponent(String(consentId ?? '').trim())
  }/document/download`,
  clientConsentDocumentPrint: (clientId, consentId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/consents/${encodeURIComponent(String(consentId ?? '').trim())
  }/document/print`,
  consentPublicPreview: '/consents/v1/public/preview',
  consentPublicSign: '/consents/v1/public/sign',
  consentPublicDecline: '/consents/v1/public/decline',
  documentsTypes: '/documents/v1/types',
  documentsGenerate: '/documents/v1/generate',
  patientLabs: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/labs`,
  patientLabById: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}`,
  patientVitals: clientId => `/client/v1/${encodeURIComponent(
    String(clientId ?? '').trim(),
  )}/vitals`,
  patientVitalById: (clientId, vitalId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/vitals/${encodeURIComponent(String(vitalId ?? '').trim())}`,
  patientLabCollect: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/collect`,
  patientLabResults: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/results`,
  patientLabReview: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/review`,
  patientLabCancel: (clientId, labId) => `/client/v1/${
    encodeURIComponent(String(clientId ?? '').trim())
  }/labs/${encodeURIComponent(String(labId ?? '').trim())}/cancel`,
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
  oauthChangeInitialPassword: '/oauth/v1/change-initial-password',
  oauthChangePassword: '/oauth/v1/change-password',
  logout: '/logout',
  clinicalResourcesList: '/clinical-resources/v1',
  clinicalResourcesPinned: '/clinical-resources/v1/pinned',
  clinicalResourceById: id => `/clinical-resources/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}`,
  clinicalResourceDocument: id => `/clinical-resources/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/document`,
  clinicalResourceDocumentDownload: (id, preview = false) => {
    const base = `/clinical-resources/v1/${encodeURIComponent(
      String(id ?? '').trim(),
    )}/document/download`
    const flag = preview ? 'true' : 'false'

    return `${base}?preview=${flag}`
  },
  clinicalResourceStatus: id => `/clinical-resources/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/status`,
  clinicalResourcePin: id => `/clinical-resources/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/pin`,
  clinicalResourceFavorite: id => `/clinical-resources/v1/${encodeURIComponent(
    String(id ?? '').trim(),
  )}/favorite`,
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
  configData: 'configData',
  userInfo: 'userInfo',
  mustChangePassword: 'mustChangePassword',
  passwordChangeMode: 'passwordChangeMode',
}

export const passwordChangeModes = {
  initial: 'initial',
  current: 'current',
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
