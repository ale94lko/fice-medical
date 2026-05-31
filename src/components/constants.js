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

/** Below this width the drawer uses overlay (mobile) behavior. */
export const drawerMobileMaxPx = 499

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
  race: 'race',
  ethnicity: 'ethnicity',
  age: 'age',
  socialSecurityNumber: 'socialSecurityNumber',
  name: 'name',
  email: 'email',
  dob: 'dob',
  clinicians: 'clinicians',
  admissionDate: 'admissionDate',
  ageUnit: 'ageUnit',
  assignedClinician: 'assignedClinician',
  status: 'status',
}

export const addClientTabKeys = {
  basic: 'basic',
  contact: 'contact',
  familyMedicalHistory: 'familyMedicalHistory',
  allergies: 'allergies',
  insurance: 'insurance',
  assessments: 'assessments',
  clinical: 'clinical',
  careCoordination: 'careCoordination',
  financials: 'financials',
  documents: 'documents',
}

/** Sub-tab keys under Clinical (Family History is implemented). */
export const addClientClinicalSubTabKeys = {
  familyHistory: 'familyHistory',
  vitals: 'vitals',
  labs: 'labs',
  carePlans: 'carePlans',
  clinicalNotes: 'clinicalNotes',
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

export const clientInsuranceMaxMemberIdLength = 50

export const clientInsuranceMaxSubscriberNameLength = 150

export const clientInsuranceMaxCardFileBytes = 5 * 1024 * 1024

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
  dob: 'dob',
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

/** Catalog names for POST /catalogs/v1/by-names */
export const catalogNames = {
  prefix: 'prefix',
  suffix: 'suffix',
  ageUnit: 'age_unit',
  gender: 'gender',
  race: 'race',
  ethnicity: 'ethnicity',
}

export const addClientBasicInfoCatalogNames = [
  catalogNames.prefix,
  catalogNames.suffix,
  catalogNames.ageUnit,
  catalogNames.gender,
  catalogNames.race,
  catalogNames.ethnicity,
]

export const apiPaths = {
  catalogsByNames: '/catalogs/v1/by-names',
  clientsList: '/client/v1/all-clients',
  clientById: id => `/client/v1/${encodeURIComponent(String(id ?? '').trim())}`,
  clientsCreate: '/client/v1/register',
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
  subtenants: 'subtenants',
  activeSubtenantId: 'activeSubtenantId',
}

/** Module names returned by POST /oauth/v1/login (modules array). */
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

export const quasarTransitions = {
  scale: 'scale',
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
