import {
  defaultTenant,
  reservedTenantSubdomains,
  tenantBaseDomains,
} from 'components/constants.js'

function normalizeHostname(hostname) {
  return String(hostname ?? '')
    .trim()
    .toLowerCase()
    .split(':')[0]
}

function isIpAddress(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
}

/**
 * First label before the configured base domain
 * (e.g. "nueva" in nueva.localhost).
 */
export function getSubdomainFromHostname(
  hostname,
  baseDomains = tenantBaseDomains,
) {
  const host = normalizeHostname(hostname)
  if (!host || isIpAddress(host)) {
    return null
  }

  const labels = host.split('.').filter(Boolean)
  if (labels.length < 2) {
    return null
  }

  const sortedBases = [...baseDomains].sort(
    (a, b) => b.split('.').length - a.split('.').length,
  )

  for (const base of sortedBases) {
    const baseLabels = base.toLowerCase().split('.').filter(Boolean)
    if (labels.length <= baseLabels.length) {
      continue
    }
    const suffix = labels.slice(-baseLabels.length)
    if (suffix.join('.') !== baseLabels.join('.')) {
      continue
    }
    const prefix = labels.slice(0, -baseLabels.length)
    if (prefix.length !== 1) {
      continue
    }
    const sub = prefix[0]
    if (!sub || reservedTenantSubdomains.has(sub)) {
      return null
    }

    return sub
  }

  return null
}

/**
 * Tenant identifier for API header X-Tenant-Key.
 * Subdomain from host or defaultTenant.
 */
export function resolveTenantKeyFromHost(hostname) {
  const host = hostname
    ?? (typeof window !== 'undefined' ? window.location.hostname : '')

  return getSubdomainFromHostname(host) || defaultTenant
}
