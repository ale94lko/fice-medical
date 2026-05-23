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
  suffix: 'suffix',
  sex: 'sex',
  age: 'age',
  socialSecurityNumber: 'socialSecurityNumber',
  name: 'name',
  email: 'email',
  dob: 'dob',
  clinicians: 'clinicians',
  admissionDate: 'admissionDate',
  status: 'status',
}

export const addClientTabKeys = {
  basic: 'basic',
  contact: 'contact',
  medicalHistory: 'medicalHistory',
}

export const clientSexValues = {
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

export const apiPaths = {
  clientsList: '/client/v1/all-clients',
  clientsCreate: '/client/v1/clients',
  oauthLogin: '/oauth/v1/login',
  oauthRefresh: '/oauth/v1/refresh',
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
