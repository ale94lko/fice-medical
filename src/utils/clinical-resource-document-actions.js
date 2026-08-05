import { quasarNotifyTypes } from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  clinicalResourceApiErrorMessage,
  downloadClinicalResourceDocument,
} from 'src/utils/clinical-resource-api.js'

export function openClinicalResourceBlobPreview(blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function triggerClinicalResourceBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName || 'document'
  anchor.click()
  URL.revokeObjectURL(url)
}

async function transferClinicalResourceDocument(
  resourceId,
  {
    preview = false,
    t,
    $q,
    fallbackKey = 'clinicalResourceDownloadError',
  } = {},
) {
  const id = Number(resourceId)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  let dismissDownloading = null
  if ($q && t) {
    dismissDownloading = $q.notify({
      timeout: 0,
      spinner: true,
      position: 'top',
      color: 'primary',
      message: t('clinicalResourceDownloading'),
    })
  }

  try {
    return await downloadClinicalResourceDocument(id, { preview })
  } catch (error) {
    if ($q && t && !isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: clinicalResourceApiErrorMessage(error, t(fallbackKey)),
      })
    }

    return null
  } finally {
    if (typeof dismissDownloading === 'function') {
      dismissDownloading()
    }
  }
}

export async function previewClinicalResourceDocument(
  resourceId,
  { t, $q, fallbackKey = 'clinicalResourcePreviewError' } = {},
) {
  const result = await transferClinicalResourceDocument(resourceId, {
    preview: true,
    t,
    $q,
    fallbackKey,
  })
  if (result?.blob) {
    openClinicalResourceBlobPreview(result.blob)

    return true
  }

  return false
}

export async function downloadClinicalResourceDocumentFile(
  resourceId,
  {
    t,
    $q,
    fileName = '',
    fallbackKey = 'clinicalResourceDownloadError',
  } = {},
) {
  const result = await transferClinicalResourceDocument(resourceId, {
    preview: false,
    t,
    $q,
    fallbackKey,
  })
  if (result?.blob) {
    triggerClinicalResourceBlobDownload(
      result.blob,
      fileName || result.fileName || 'document',
    )

    return true
  }

  return false
}
