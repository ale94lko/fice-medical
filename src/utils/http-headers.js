/**
 * Read a response header in a way that works with AxiosHeaders and
 * plain maps. Bracket access (`headers['content-disposition']`) is
 * unreliable on AxiosHeaders.
 */
export function getResponseHeader(headers, name) {
  if (!headers || !name) {
    return ''
  }
  const target = String(name).toLowerCase()
  if (typeof headers.get === 'function') {
    const viaGet = headers.get(name) ?? headers.get(target)
    if (viaGet != null && viaGet !== '') {
      return Array.isArray(viaGet)
        ? String(viaGet[0] ?? '')
        : String(viaGet)
    }
  }
  const direct = headers[target] ?? headers[name]
  if (direct != null && direct !== '') {
    return Array.isArray(direct)
      ? String(direct[0] ?? '')
      : String(direct)
  }
  const keys = typeof headers.toJSON === 'function'
    ? Object.keys(headers.toJSON())
    : Object.keys(headers)
  for (const key of keys) {
    if (String(key).toLowerCase() === target) {
      const value = typeof headers.get === 'function'
        ? headers.get(key)
        : headers[key]
      if (value != null && value !== '') {
        return Array.isArray(value)
          ? String(value[0] ?? '')
          : String(value)
      }
    }
  }

  return ''
}

/**
 * Parse a Content-Disposition header value into a filename.
 */
export function parseContentDispositionFileName(
  disposition,
  fallback = 'download',
) {
  const raw = String(disposition ?? '').trim()
  if (!raw) {
    return fallback
  }
  const utf8Match = /filename\*\s*=\s*(?:UTF-8''|utf-8'')([^;]+)/i
    .exec(raw)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(
        utf8Match[1].trim().replace(/^["']|["']$/g, ''),
      )
    } catch {
      // Fall through to filename=
    }
  }
  const quoted = /filename\s*=\s*"((?:\\.|[^"\\])*)"/i.exec(raw)
  if (quoted?.[1]) {
    return quoted[1].replace(/\\(.)/g, '$1').trim() || fallback
  }
  const plain = /filename\s*=\s*([^;\s]+)/i.exec(raw)
  if (plain?.[1]) {
    return plain[1].replace(/^["']|["']$/g, '').trim() || fallback
  }

  return fallback
}

/**
 * Parse Content-Disposition filename from Axios/plain response headers.
 */
export function extractContentDispositionFileName(
  headers,
  fallback = 'download',
) {
  return parseContentDispositionFileName(
    getResponseHeader(headers, 'content-disposition'),
    fallback,
  )
}

/**
 * Resolve download filename from an Axios response (headers + XHR fallback).
 */
export function extractDownloadFileName(response, fallback = 'download') {
  const fromHeaders = extractContentDispositionFileName(
    response?.headers,
    '',
  )
  if (fromHeaders) {
    return fromHeaders
  }
  const xhr = response?.request
  if (xhr && typeof xhr.getResponseHeader === 'function') {
    const raw = xhr.getResponseHeader('Content-Disposition')
      || xhr.getResponseHeader('content-disposition')
    if (raw) {
      return parseContentDispositionFileName(raw, fallback)
    }
  }

  return fallback
}

/**
 * BE naming: client-consent-{id}-v{version}.pdf
 * Print: client-consent-{id}-v{version}-print.pdf
 */
export function buildClientConsentDocumentFileName(
  consent,
  { print = false } = {},
) {
  const idNum = Number(consent?.id)
  const idPart = Number.isFinite(idNum) && idNum > 0
    ? String(idNum)
    : 'unknown'
  const version = String(consent?.version ?? '').trim() || '1'
  const suffix = print ? '-print' : ''

  return `client-consent-${idPart}-v${version}${suffix}.pdf`
}
