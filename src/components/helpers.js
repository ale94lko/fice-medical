function isEmpty(value) {
  return value === null || value === undefined || value === ''
}

function pickExpiration(td, root) {
  let expiration =
    td?.expiration ?? td?.expires_at ?? td?.expiresAt
    ?? root?.expiration ?? root?.expires_at ?? root?.expiresAt
  if (!isEmpty(expiration)) {
    return String(expiration)
  }
  const ei = root?.expires_in ?? td?.expires_in
  if (typeof ei === 'number' && Number.isFinite(ei)) {
    return new Date(Date.now() + ei * 1000).toISOString()
  }

  return ''
}

function extractFromFiCeEnvelope(body) {
  const envelope = body.data
  if (!envelope?.token_data?.token) {
    return null
  }
  const td = envelope.token_data
  const refreshToken =
    envelope.refresh_token_data?.token
    || envelope.refreshTokenData?.token

  return {
    token: td.token,
    expiration: pickExpiration(td, {}),
    refreshToken,
  }
}

function extractFromRoots(body) {
  const roots = []
  const push = r => {
    if (r && typeof r === 'object' && !roots.includes(r)) {
      roots.push(r)
    }
  }
  push(body.data)
  push(body.data?.data)
  if (body.token || body.access_token) {
    push(body)
  }
  if (body.token_data) {
    push(body)
  }

  for (const root of roots) {
    const td = root.token_data
    const token =
      td?.token
      || root.token
      || root.access_token
    if (!token) {
      continue
    }
    const refreshToken =
      root.refresh_token_data?.token
      || root.refreshTokenData?.token

    return {
      token,
      expiration: pickExpiration(td || {}, root),
      refreshToken,
    }
  }

  return null
}

export function extractOAuthTokenPayload(body) {
  if (!body || typeof body !== 'object') {
    return null
  }
  const fromEnvelope = extractFromFiCeEnvelope(body)
  if (fromEnvelope) {
    return fromEnvelope
  }

  return extractFromRoots(body)
}
