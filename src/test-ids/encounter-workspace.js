import { toTestId } from 'src/utils/base.js'

export const encounterWorkspaceTestIds = {
  page: 'encounter-workspace-page',
  header: 'encounter-workspace-header',
  allergyBanner: 'encounter-workspace-allergy-banner',
  tabs: 'encounter-workspace-tabs',
  tab: key => toTestId('encounter-workspace-tab', key),
  complete: 'encounter-workspace-btn-complete',
  cancel: 'encounter-workspace-btn-cancel',
  reopen: 'encounter-workspace-btn-reopen',
  patientChart: 'encounter-workspace-btn-patient-chart',
  checklist: 'encounter-workspace-checklist',
  billing: 'encounter-workspace-billing',
  optionalActions: 'encounter-workspace-optional-actions',
  overview: 'encounter-workspace-overview',
  visit: 'encounter-workspace-visit',
  clinical: 'encounter-workspace-clinical',
  note: 'encounter-workspace-note',
  followUp: 'encounter-workspace-follow-up',
}
