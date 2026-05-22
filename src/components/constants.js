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
