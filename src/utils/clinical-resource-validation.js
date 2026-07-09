import {
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
    }
  }

  return errors
}
