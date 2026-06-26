import {
  clientProfilePhotoCropMaxZoom,
  clientProfilePhotoCropMinZoom,
  clientProfilePhotoCropViewportSize,
  clientProfilePhotoOutputMime,
  clientProfilePhotoOutputQuality,
  clientProfilePhotoOutputSize,
} from 'components/constants.js'

export function getProfilePhotoCoverScale(
  imageWidth,
  imageHeight,
  viewportSize = clientProfilePhotoCropViewportSize,
) {
  if (!imageWidth || !imageHeight) {
    return 1
  }

  return Math.max(
    viewportSize / imageWidth,
    viewportSize / imageHeight,
  )
}

export function clampProfilePhotoPanOffset(
  offsetX,
  offsetY,
  imageWidth,
  imageHeight,
  displayScale,
  viewportSize = clientProfilePhotoCropViewportSize,
) {
  const radius = viewportSize / 2
  const halfW = (imageWidth * displayScale) / 2
  const halfH = (imageHeight * displayScale) / 2
  const minX = radius - halfW
  const maxX = halfW - radius
  const minY = radius - halfH
  const maxY = halfH - radius

  return {
    offsetX: Math.min(maxX, Math.max(minX, offsetX)),
    offsetY: Math.min(maxY, Math.max(minY, offsetY)),
  }
}

export function clampProfilePhotoZoom(zoom) {
  return Math.min(
    clientProfilePhotoCropMaxZoom,
    Math.max(clientProfilePhotoCropMinZoom, zoom),
  )
}

export function loadProfilePhotoImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    image.src = url
  })
}

export function exportCroppedProfilePhoto({
  image,
  zoom,
  offsetX,
  offsetY,
  viewportSize = clientProfilePhotoCropViewportSize,
  outputSize = clientProfilePhotoOutputSize,
  outputMime = clientProfilePhotoOutputMime,
  outputQuality = clientProfilePhotoOutputQuality,
}) {
  const coverScale = getProfilePhotoCoverScale(
    image.naturalWidth,
    image.naturalHeight,
    viewportSize,
  )
  const displayScale = coverScale * zoom
  const exportScale = outputSize / viewportSize
  const canvas = document.createElement('canvas')

  canvas.width = outputSize
  canvas.height = outputSize

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas not supported')
  }

  ctx.beginPath()
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  const drawW = image.naturalWidth * displayScale * exportScale
  const drawH = image.naturalHeight * displayScale * exportScale
  const centerX = outputSize / 2 + offsetX * exportScale
  const centerY = outputSize / 2 + offsetY * exportScale

  ctx.drawImage(
    image,
    centerX - drawW / 2,
    centerY - drawH / 2,
    drawW,
    drawH,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Failed to export image'))

          return
        }

        resolve(blob)
      },
      outputMime,
      outputQuality,
    )
  })
}

export function profilePhotoBlobToFile(
  blob,
  originalFileName = 'profile-photo',
) {
  const baseName = String(originalFileName).replace(/\.[^.]+$/, '')

  return new File([blob], `${baseName}.jpg`, {
    type: blob.type,
    lastModified: Date.now(),
  })
}
