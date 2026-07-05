import { getActivePinia } from 'pinia'
import { useAuthStore } from 'stores/auth-store.js'
import { passwordErrorCodes } from 'src/utils/password-validation.js'

function collectPayloadCandidates(payload) {
  const body = payload?.response?.data ?? payload?.data ?? payload
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return []
  }

  const candidates = [body]
  const nested = body.data
  if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
    candidates.push(nested)
  }

  return candidates
}

export function isPasswordChangeRequiredPayload(payload) {
  const candidates = collectPayloadCandidates(payload)
  if (!candidates.length) {
    return false
  }

  for (const item of candidates) {
    const code = Number(item.error_code ?? item.errorCode)
    if (code === passwordErrorCodes.changeRequired) {
      return true
    }
  }

  for (const item of candidates) {
    const errorToken = String(item.error ?? '').trim().toUpperCase()
    if (errorToken === 'PASSWORD_CHANGE_REQUIRED') {
      return true
    }
  }

  return false
}

export function isPasswordChangeRequiredError(error) {
  return isPasswordChangeRequiredPayload(error)
}

export function markErrorAsPasswordChangeRequired(error) {
  if (error?.config) {
    error.config.__passwordChangeRequired = true
  }
}

export function isPasswordChangeRequiredHandledError(error) {
  return Boolean(error?.config?.__passwordChangeRequired)
}

function applyPasswordChangeRequiredState() {
  const pinia = getActivePinia()
  if (!pinia) {
    return false
  }

  useAuthStore(pinia).requirePasswordChange()

  return true
}

async function ensureAuthenticatedShellForPasswordChange() {
  try {
    const pinia = getActivePinia()
    if (!pinia) {
      return
    }
    const authStore = useAuthStore(pinia)
    const router = authStore.router
    const path = String(router?.currentRoute?.value?.path ?? '')
    if (!router || path === '/login' || path === '/reset-password') {
      await router?.replace('/dashboard').catch(() => {})
    }
  } catch {
    // Router may not be mounted yet
  }
}

export async function applyPasswordChangeRequiredFromApiError(error) {
  if (!isPasswordChangeRequiredError(error)) {
    return false
  }

  markErrorAsPasswordChangeRequired(error)
  const applied = applyPasswordChangeRequiredState()
  if (applied) {
    await ensureAuthenticatedShellForPasswordChange()
  }

  return true
}

export async function applyPasswordChangeRequiredFromApiResponse(response) {
  if (!isPasswordChangeRequiredPayload(response)) {
    return false
  }

  const error = {
    response,
    config: response?.config,
  }
  markErrorAsPasswordChangeRequired(error)
  const applied = applyPasswordChangeRequiredState()
  if (applied) {
    await ensureAuthenticatedShellForPasswordChange()
  }

  return true
}

export function createPasswordChangeRequiredRejection(response) {
  const error = new Error('PASSWORD_CHANGE_REQUIRED')
  error.response = response
  error.config = response?.config
  markErrorAsPasswordChangeRequired(error)

  return Promise.reject(error)
}
