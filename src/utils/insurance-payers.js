/** Payer/plan options from catalog `payer` (see useAddClientCatalogs). */

const MIN_SEARCH_LEN = 2

const LABEL_SPLIT_RE = /\s*[—–-]\s*/

/**
 * Map a catalog_items row into { id, payer, plan } for insurance forms.
 * Prefers `code` as stable id; splits display label on em/en/hyphen dash.
 *
 * @param {object} item Raw catalog item
 * @returns {{ id: string, payer: string, plan: string } | null}
 */
export function payerRecordFromCatalogItem(item) {
  const code = String(item?.code ?? '').trim()
  const label = String(item?.label ?? item?.name ?? '').trim()
  const id = code || String(item?.id ?? '').trim() || label
  if (!id && !label) {
    return null
  }
  const parts = label.split(LABEL_SPLIT_RE).map(s => s.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return {
      id,
      payer: parts[0],
      plan: parts.slice(1).join(' — '),
    }
  }

  return { id, payer: label, plan: '' }
}

export function filterInsurancePayers(query, catalogItems = []) {
  const q = String(query ?? '').trim().toLowerCase()
  if (q.length < MIN_SEARCH_LEN) {
    return []
  }
  const rows = []
  for (const raw of catalogItems) {
    const item = payerRecordFromCatalogItem(raw)
    if (!item) {
      continue
    }
    const payer = item.payer.toLowerCase()
    const plan = item.plan.toLowerCase()
    const combined = `${payer} ${plan}`.trim()
    const idLower = String(item.id).toLowerCase()
    if (
      payer.includes(q)
      || plan.includes(q)
      || combined.includes(q)
      || idLower.includes(q)
    ) {
      rows.push(item)
    }
  }

  return rows
}

export function formatPayerPlanLabel(item) {
  if (!item) {
    return ''
  }
  if (item.plan) {
    return `${item.payer} — ${item.plan}`
  }

  return item.payer
}

export function findPayerById(id, catalogItems = []) {
  if (id == null || id === '') {
    return null
  }
  const sid = String(id).trim()
  for (const raw of catalogItems) {
    const item = payerRecordFromCatalogItem(raw)
    if (!item) {
      continue
    }
    if (String(item.id) === sid) {
      return item
    }
  }

  return null
}
