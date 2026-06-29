import { subtenantStatusValues } from 'components/constants.js'

export function createEmptySubtenantForm() {
  return {
    id: null,
    name: '',
    code: '',
    main: false,
    status: subtenantStatusValues.active,
  }
}

export function normalizeSubtenantFromApi(raw = {}) {
  const status = Number(raw.status ?? subtenantStatusValues.active)

  return {
    id: raw.id ?? null,
    name: String(raw.name ?? '').trim(),
    code: String(raw.code ?? '').trim(),
    main: Boolean(raw.main),
    status: status === subtenantStatusValues.inactive
      ? subtenantStatusValues.inactive
      : subtenantStatusValues.active,
  }
}

export function buildSubtenantRequest(form = {}) {
  return {
    name: String(form.name ?? '').trim(),
    main: Boolean(form.main),
    status: Number(form.status ?? subtenantStatusValues.active),
  }
}

export function cloneSubtenantForm(form) {
  return {
    ...createEmptySubtenantForm(),
    ...form,
  }
}
