export const AUTH_STORAGE_PACKED_PREFIX = 'enc.v1:'
const PACKED_PREFIX = AUTH_STORAGE_PACKED_PREFIX
export const AUTH_WRAP_STORAGE_KEY = 'fice.auth.wrap.v1'

function bytesToBase64(bytes) {
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }

  return btoa(binary)
}

function base64ToBytes(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

async function aesKeyFromSecret(secret) {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(String(secret || '')),
  )

  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptJsonForStorage(value, secret) {
  const keyText = String(secret || '')
  if (!keyText || !globalThis.crypto?.subtle) {
    return ''
  }
  const key = await aesKeyFromSecret(keyText)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(value ?? null)),
  )
  const packed = new Uint8Array(iv.length + cipher.byteLength)
  packed.set(iv, 0)
  packed.set(new Uint8Array(cipher), iv.length)

  return PACKED_PREFIX + bytesToBase64(packed)
}

export async function decryptJsonFromStorage(packed, secret) {
  const raw = String(packed || '')
  if (!raw) {
    return null
  }
  if (!raw.startsWith(PACKED_PREFIX)) {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  const keyText = String(secret || '')
  if (!keyText || !globalThis.crypto?.subtle) {
    return null
  }
  try {
    const bytes = base64ToBytes(raw.slice(PACKED_PREFIX.length))
    const iv = bytes.slice(0, 12)
    const cipher = bytes.slice(12)
    const key = await aesKeyFromSecret(keyText)
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher,
    )

    return JSON.parse(new TextDecoder().decode(plain))
  } catch {
    return null
  }
}

export function readAuthWrapSecret() {
  if (typeof sessionStorage === 'undefined' || !globalThis.crypto?.getRandomValues) {
    return ''
  }
  const existing = sessionStorage.getItem(AUTH_WRAP_STORAGE_KEY)
  if (existing) {
    return existing
  }
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const secret = bytesToBase64(bytes)
  sessionStorage.setItem(AUTH_WRAP_STORAGE_KEY, secret)

  return secret
}

export function clearAuthWrapSecret() {
  if (typeof sessionStorage === 'undefined') {
    return
  }
  sessionStorage.removeItem(AUTH_WRAP_STORAGE_KEY)
}
