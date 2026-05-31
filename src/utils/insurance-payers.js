/** Mock payer/plan catalog until payer search API is available. */
export const INSURANCE_PAYER_OPTIONS = [
  {
    id: 'aetna-bh-community',
    payer: 'Aetna Better Health',
    plan: 'Community Plan',
  },
  {
    id: 'humana-gold',
    payer: 'Humana',
    plan: 'Gold Plus',
  },
  {
    id: 'bcbs-standard',
    payer: 'Blue Cross Blue Shield',
    plan: 'Standard PPO',
  },
  {
    id: 'united-choice',
    payer: 'UnitedHealthcare',
    plan: 'Choice Plus',
  },
  {
    id: 'molina-managed',
    payer: 'Molina Healthcare',
    plan: 'Managed Medicaid Plan',
  },
  {
    id: 'cigna-open',
    payer: 'Cigna',
    plan: 'Open Access',
  },
  {
    id: 'medicare-part-a',
    payer: 'Medicare',
    plan: 'Part A',
  },
  {
    id: 'medicaid-state',
    payer: 'State Medicaid',
    plan: 'Standard Coverage',
  },
]

const MIN_SEARCH_LEN = 2

export function filterInsurancePayers(query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (q.length < MIN_SEARCH_LEN) {
    return []
  }
  return INSURANCE_PAYER_OPTIONS.filter(item => {
    const payer = item.payer.toLowerCase()
    const plan = item.plan.toLowerCase()
    const combined = `${payer} ${plan}`

    return payer.includes(q) || plan.includes(q) || combined.includes(q)
  })
}

export function formatPayerPlanLabel(item) {
  if (!item) {
    return ''
  }

  return `${item.payer} — ${item.plan}`
}

export function findPayerById(id) {
  return INSURANCE_PAYER_OPTIONS.find(
    item => item.id === id,
  ) ?? null
}
