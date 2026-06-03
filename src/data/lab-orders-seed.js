/* eslint-disable camelcase -- seed data mirrors API snake_case */
import {
  labCategories,
  labClinicalKeys,
  labFlags,
  labPriorities,
  labStatuses,
} from 'components/constants.js'

/** Sample labs for mock store when patient has no records yet. */
export function buildLabSeedForPatient(patientId) {
  const pid = String(patientId ?? '').trim()
  if (!pid) {
    return []
  }

  return [
    {
      id: 'lab-seed-cbc',
      patient_id: pid,
      test_name: 'Complete Blood Count (CBC)',
      category: labCategories.bloodTest,
      ordering_clinician_id: 'clin-1',
      ordering_clinician_name: 'Dr. John Smith',
      status: labStatuses.resulted,
      ordered_date: '05/15/2026',
      collected_date: '05/16/2026',
      result_date: '05/17/2026',
      priority: labPriorities.routine,
      specimen_type: 'blood',
      abnormal_result: true,
      components: [
        {
          id: 'cmp-seed-hgb',
          component_name: 'Hemoglobin',
          clinical_key: labClinicalKeys.hemoglobin,
          value: '13.5',
          unit: 'g/dL',
          reference_range_low: 12,
          reference_range_high: 16,
          flag: labFlags.normal,
          result_date: '05/17/2026',
        },
        {
          id: 'cmp-seed-wbc',
          component_name: 'WBC',
          clinical_key: labClinicalKeys.wbc,
          value: '12.1',
          unit: 'K/uL',
          reference_range_low: 4,
          reference_range_high: 11,
          flag: labFlags.high,
          result_date: '05/17/2026',
        },
        {
          id: 'cmp-seed-plt',
          component_name: 'Platelets',
          clinical_key: labClinicalKeys.platelets,
          value: '250',
          unit: 'K/uL',
          reference_range_low: 150,
          reference_range_high: 400,
          flag: labFlags.normal,
          result_date: '05/17/2026',
        },
      ],
      attachments: [],
    },
    {
      id: 'lab-seed-a1c',
      patient_id: pid,
      test_name: 'Hemoglobin A1C',
      category: labCategories.bloodTest,
      ordering_clinician_id: 'clin-1',
      ordering_clinician_name: 'Dr. John Smith',
      status: labStatuses.reviewed,
      ordered_date: '04/01/2026',
      collected_date: '04/02/2026',
      result_date: '04/05/2026',
      priority: labPriorities.routine,
      abnormal_result: false,
      components: [
        {
          id: 'cmp-seed-a1c',
          component_name: 'Hemoglobin A1C',
          clinical_key: labClinicalKeys.a1c,
          value: '6.2',
          unit: '%',
          reference_range_low: 4,
          reference_range_high: 5.6,
          flag: labFlags.high,
          result_date: '04/05/2026',
        },
      ],
      attachments: [],
    },
  ]
}
