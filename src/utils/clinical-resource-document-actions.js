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

export async function previewClinicalResourceDocument(
  resourceId,
  { t, $q, fallbackKey = 'clinicalResourcePreviewError' } = {},
) {
  const id = Number(resourceId)
  if (!Number.isFinite(id) || id <= 0) {
    return false
  }

  try {
    const result = await downloadClinicalResourceDocument(id, { preview: true })
    if (result?.blob) {
      openClinicalResourceBlobPreview(result.blob)

      return true
    }
  } catch (error) {
    if ($q && t && !isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: clinicalResourceApiErrorMessage(error, t(fallbackKey)),
      })
    }
  }

  return false
}
