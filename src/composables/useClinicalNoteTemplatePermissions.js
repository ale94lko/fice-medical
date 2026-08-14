import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

function usePermission(permissions, permission) {
  return computed(() => hasPermission(permissions.value, permission))
}

export function useClinicalNoteTemplatePermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canView = usePermission(
    permissions,
    permissionNames.clinicalNoteTemplateView,
  )
  const canCreate = usePermission(
    permissions,
    permissionNames.clinicalNoteTemplateCreate,
  )
  const canEdit = usePermission(
    permissions,
    permissionNames.clinicalNoteTemplateEdit,
  )
  const canDuplicate = usePermission(
    permissions,
    permissionNames.clinicalNoteTemplateDuplicate,
  )
  const canActivate = usePermission(
    permissions,
    permissionNames.clinicalNoteTemplateActivate,
  )
  const canDeactivate = usePermission(
    permissions,
    permissionNames.clinicalNoteTemplateDeactivate,
  )

  return {
    canView,
    canCreate,
    canEdit,
    canDuplicate,
    canActivate,
    canDeactivate,
  }
}

export const clinicalNoteSectionTypes = {
  autoData: 'AUTO_DATA',
  narrativeField: 'NARRATIVE_FIELD',
  assessment: 'ASSESSMENT',
  structuredSection: 'STRUCTURED_SECTION',
}

export const clinicalNoteDataSources = [
  'ENCOUNTER_SUMMARY',
  'REASON_FOR_VISIT',
  'SERVICES',
  'DIAGNOSES',
  'VITALS',
  'MEDICATIONS',
  'CARE_PLAN',
  'FOLLOW_UP',
  'REFERRALS',
  'PROVIDER',
  'MEDICATION_CHANGES',
]

export const clinicalNoteInputTypes = [
  'SHORT_TEXT',
  'LONG_TEXT',
  'RICH_TEXT',
]
