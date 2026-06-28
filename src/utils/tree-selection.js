export function collectLeafValues(node) {
  if (!node) {
    return []
  }
  if (Array.isArray(node.children) && node.children.length) {
    return node.children.flatMap(child => collectLeafValues(child))
  }
  if (node.value != null && String(node.value).trim() !== '') {
    return [String(node.value)]
  }

  return []
}

export function getBranchCheckState(node, selectedSet) {
  const leafValues = collectLeafValues(node)
  if (!leafValues.length) {
    return 'unchecked'
  }
  const selectedCount = leafValues.filter(
    value => selectedSet.has(String(value)),
  ).length
  if (selectedCount === 0) {
    return 'unchecked'
  }
  if (selectedCount === leafValues.length) {
    return 'checked'
  }

  return 'indeterminate'
}

export function toggleBranchSelection(node, selectedValues, checked) {
  const leafValues = collectLeafValues(node)
  const next = new Set(
    (selectedValues ?? []).map(value => String(value)),
  )
  if (checked) {
    leafValues.forEach(value => next.add(String(value)))
  } else {
    leafValues.forEach(value => next.delete(String(value)))
  }

  return Array.from(next)
}

export function toggleLeafSelection(value, selectedValues, checked) {
  const key = String(value)
  const next = new Set(
    (selectedValues ?? []).map(item => String(item)),
  )
  if (checked) {
    next.add(key)
  } else {
    next.delete(key)
  }

  return Array.from(next)
}
