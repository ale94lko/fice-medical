/** Canonical prescription catalogs (code → display). */

import { medicationFrequencyOther } from 'components/constants.js'

export const MEDICATION_DOSAGE_UNIT_OPTIONS = [
  { value: 'mcg', label: 'Microgram (mcg)' },
  { value: 'mg', label: 'Milligram (mg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'mL', label: 'Milliliter (mL)' },
  { value: 'L', label: 'Liter (L)' },
  { value: 'unit', label: 'Unit (unit)' },
  { value: 'IU', label: 'International Unit (IU)' },
  { value: 'mEq', label: 'Milliequivalent (mEq)' },
  { value: 'mmol', label: 'Millimole (mmol)' },
  { value: 'tablet', label: 'Tablet (tablet)' },
  { value: 'capsule', label: 'Capsule (capsule)' },
  { value: 'drop', label: 'Drop (drop)' },
  { value: 'puff', label: 'Puff (puff)' },
  { value: 'spray', label: 'Spray (spray)' },
  { value: 'patch', label: 'Patch (patch)' },
  { value: 'packet', label: 'Packet (packet)' },
  { value: 'suppository', label: 'Suppository (suppository)' },
  { value: 'application', label: 'Application (application)' },
  { value: 'inhalation', label: 'Inhalation (inhalation)' },
]

export const MEDICATION_ROUTE_OPTIONS = [
  { value: 'PO', label: 'Oral (PO)' },
  { value: 'SL', label: 'Sublingual (SL)' },
  { value: 'BUCC', label: 'Buccal (BUCC)' },
  { value: 'IV', label: 'Intravenous (IV)' },
  { value: 'IM', label: 'Intramuscular (IM)' },
  { value: 'SC', label: 'Subcutaneous (SC / SQ)' },
  { value: 'ID', label: 'Intradermal (ID)' },
  { value: 'IN', label: 'Intranasal (IN)' },
  { value: 'INH', label: 'Inhalation (INH)' },
  { value: 'TOP', label: 'Topical (TOP)' },
  { value: 'TD', label: 'Transdermal (TD)' },
  { value: 'OPHTH', label: 'Ophthalmic (OPHTH)' },
  { value: 'OTIC', label: 'Otic (OTIC)' },
  { value: 'RECT', label: 'Rectal (RECT)' },
  { value: 'VAG', label: 'Vaginal (VAG)' },
  { value: 'NG', label: 'Nasogastric (NG)' },
  { value: 'GT', label: 'Gastrostomy Tube (GT)' },
  { value: 'JT', label: 'Jejunostomy Tube (JT)' },
  { value: 'PEG', label: 'PEG Tube (PEG)' },
  { value: 'ET', label: 'Endotracheal (ET)' },
  { value: 'NEB', label: 'Nebulization (NEB)' },
]

export const MEDICATION_FREQUENCY_OPTIONS = [
  { value: 'QD', label: 'Once daily (QD)' },
  { value: 'BID', label: 'Twice daily (BID)' },
  { value: 'TID', label: 'Three times daily (TID)' },
  { value: 'QID', label: 'Four times daily (QID)' },
  { value: 'QAM', label: 'Every morning (QAM)' },
  { value: 'QPM', label: 'Every evening (QPM)' },
  { value: 'QHS', label: 'At bedtime (QHS)' },
  { value: 'QOD', label: 'Every other day (QOD)' },
  { value: 'Q4H', label: 'Every 4 hours (Q4H)' },
  { value: 'Q6H', label: 'Every 6 hours (Q6H)' },
  { value: 'Q8H', label: 'Every 8 hours (Q8H)' },
  { value: 'Q12H', label: 'Every 12 hours (Q12H)' },
  { value: 'WEEKLY', label: 'Once weekly (Weekly)' },
  { value: 'PRN', label: 'As needed (PRN)' },
  { value: medicationFrequencyOther, label: 'Other / Custom' },
]

export function isCustomMedicationFrequency(value) {
  return String(value ?? '').trim().toUpperCase()
    === medicationFrequencyOther
}

export function withCurrentCatalogOption(options, value, label) {
  const list = Array.isArray(options) ? [...options] : []
  const token = String(value ?? '').trim()
  if (!token) {
    return list
  }
  const exists = list.some(option =>
    String(option?.value ?? '').trim() === token,
  )
  if (exists) {
    return list
  }
  const display = String(label ?? '').trim() || token

  return [{ value: token, label: display }, ...list]
}

export { medicationFrequencyOther }
