import {
  clinicalResourceDocumentExtensions,
  clinicalResourceDocumentMimeTypes,
  clinicalResourceTypeValues,
} from 'components/constants.js'

function trim(value) {
  return String(value ?? '').trim()
}

function isValidHttpUrl(value) {
  const raw = trim(value)
  if (!raw) {
    return false
  }
  try {
    const parsed = new URL(raw)

    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function isClinicalResourceDocumentFileAllowed(file) {
  if (!file) {
    return false
  }
  const type = String(file.type ?? '').toLowerCase()
  const name = String(file.name ?? '').toLowerCase()
  const extOk = clinicalResourceDocumentExtensions.some(ext =>
    name.endsWith(ext),
  )
  const mimeOk = !type || clinicalResourceDocumentMimeTypes.includes(type)

  return extOk || mimeOk
}

export function validateClinicalResourceForm(form, t, { isEdit = false } = {}) {
  const errors = {}
  const title = trim(form.title)
  const category = trim(form.category)
  const type = trim(form.type)
  const content = trim(form.content)
  const url = trim(form.url)
  const hasDocumentFile = Boolean(form.documentFile)
  const hasStoredFile = Number(form.storedFileId) > 0
    || Boolean(form.documentFileName)

  if (!title) {
    errors.title = t('clinicalResourceTitleRequired')
  }
  if (!category) {
    errors.category = t('clinicalResourceCategoryRequired')
  }
  if (!isEdit && !type) {
    errors.type = t('clinicalResourceTypeRequired')
  }
  if (type === clinicalResourceTypeValues.externalLink) {
    if (!url) {
      errors.url = t('clinicalResourceUrlRequired')
    } else if (!isValidHttpUrl(url)) {
      errors.url = t('clinicalResourceUrlInvalid')
    }
  }
  if (type === clinicalResourceTypeValues.document) {
    if (!content) {
      errors.content = t('clinicalResourceContentRequired')
    }
    if (!isEdit && !hasDocumentFile && !hasStoredFile) {
      errors.documentFile = t('clinicalResourceDocumentRequired')
    } else if (
      hasDocumentFile
      && !isClinicalResourceDocumentFileAllowed(form.documentFile)
    ) {
      errors.documentFile = t('clinicalResourceDocumentTypeInvalid')
    }
  }

  return errors
}
