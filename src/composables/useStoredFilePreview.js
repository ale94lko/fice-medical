import { onBeforeUnmount, ref, watch } from 'vue'
import {
  fetchStoredFileBlob,
  revokeStoredFileImageSrc,
} from 'src/utils/stored-file-api.js'

function parsePreviewFileId(fileId) {
  const id = Number(fileId)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  return id
}

export function useStoredFilePreview(fileIdSource) {
  const previewSrc = ref('')
  const loading = ref(false)
  let blobUrl = ''
  let loadedFileId = null
  let loadGeneration = 0

  function clearBlobUrl() {
    if (blobUrl) {
      revokeStoredFileImageSrc(blobUrl)
      blobUrl = ''
    }
    previewSrc.value = ''
    loadedFileId = null
  }

  async function refreshPreview() {
    const fileId = parsePreviewFileId(fileIdSource.value)
    if (fileId == null) {
      clearBlobUrl()
      loading.value = false

      return
    }
    if (loadedFileId === fileId && previewSrc.value) {
      return
    }

    const generation = loadGeneration + 1
    loadGeneration = generation
    clearBlobUrl()
    loading.value = true

    try {
      const blob = await fetchStoredFileBlob(fileId, true)
      if (loadGeneration !== generation) {
        return
      }
      if (parsePreviewFileId(fileIdSource.value) !== fileId) {
        return
      }

      blobUrl = URL.createObjectURL(blob)
      previewSrc.value = blobUrl
      loadedFileId = fileId
    } catch {
      if (loadGeneration === generation) {
        previewSrc.value = ''
        loadedFileId = null
      }
    } finally {
      if (loadGeneration === generation) {
        loading.value = false
      }
    }
  }

  watch(fileIdSource, () => {
    void refreshPreview()
  }, { immediate: true })

  onBeforeUnmount(() => {
    loadGeneration += 1
    clearBlobUrl()
    loading.value = false
  })

  return {
    previewSrc,
    loading,
    refreshPreview,
  }
}
