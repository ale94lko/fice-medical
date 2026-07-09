const CATEGORY_CHIP_PALETTE = [
  { color: 'teal-1', textColor: 'teal-9' },
  { color: 'blue-1', textColor: 'blue-9' },
  { color: 'purple-1', textColor: 'purple-9' },
  { color: 'green-1', textColor: 'green-9' },
  { color: 'cyan-1', textColor: 'cyan-9' },
  { color: 'orange-1', textColor: 'orange-9' },
  { color: 'pink-1', textColor: 'pink-9' },
  { color: 'indigo-1', textColor: 'indigo-9' },
  { color: 'amber-1', textColor: 'amber-10' },
  { color: 'deep-orange-1', textColor: 'deep-orange-9' },
]

const EMPTY_CATEGORY_CHIP = {
  color: 'grey-2',
  textColor: 'grey-8',
}

function hashString(value) {
  let hash = 0
  const text = String(value ?? '')

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0
  }

  return Math.abs(hash)
}

export function resolveClinicalResourceCategoryChipColors(category) {
  const label = String(category ?? '').trim()
  if (!label) {
    return { ...EMPTY_CATEGORY_CHIP }
  }

  const index = hashString(label.toLowerCase()) % CATEGORY_CHIP_PALETTE.length

  return { ...CATEGORY_CHIP_PALETTE[index] }
}
