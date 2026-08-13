<template>
  <div
    class="encounter-workspace-visit"
    :data-testid="tid.visit">
    <section
      class="
        encounter-workspace-card
        encounter-workspace-visit__chief-complaint
      "
    >
      <div class="encounter-workspace-card__head">
        <h2>{{ t('encounterNotesSection') }}</h2>
      </div>
      <q-input
        v-model="chiefComplaintDraft"
        outlined
        dense
        hide-bottom-space
        type="textarea"
        :rows="2"
        :readonly="!canEdit"
        :disable="saving"
        :placeholder="t('encounterChiefComplaintPlaceholder')"
        data-testid="encounter-chief-complaint"
        @blur="saveChiefComplaint"
      />
    </section>

    <div class="encounter-workspace-visit__columns">
      <section class="encounter-workspace-card">
        <div class="encounter-workspace-card__head">
          <h2>{{ t('encounterServices') }}</h2>
        </div>
        <EncounterServicesEditor
          :encounter="encounter"
          :can-edit="canEdit"
          @saved="emit('services-saved', $event)"
        />
      </section>

      <section class="encounter-workspace-card">
        <EncounterDiagnosesEditor
          :encounter="encounter"
          :can-edit="canEdit"
          @saved="emit('diagnoses-saved', $event)"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { quasarNotifyTypes } from 'components/constants.js'
import EncounterDiagnosesEditor from
  'components/encounter/EncounterDiagnosesEditor.vue'
import EncounterServicesEditor from
  'components/encounter/EncounterServicesEditor.vue'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  encounterApiErrorMessage,
  patchEncounter,
} from 'src/utils/encounter-api.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'

const props = defineProps({
  encounter: {
    type: Object,
    default: null,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'services-saved',
  'diagnoses-saved',
  'chief-complaint-saved',
])

const { t } = useI18n()
const $q = useQuasar()

const chiefComplaintDraft = ref('')
const saving = ref(false)
const lastSavedComplaint = ref('')

function resolveChiefComplaint(encounter) {
  return String(
    encounter?.chiefComplaint
    ?? encounter?.notes
    ?? '',
  ).trim()
}

function syncChiefComplaintFromEncounter() {
  const value = resolveChiefComplaint(props.encounter)
  chiefComplaintDraft.value = value
  lastSavedComplaint.value = value
}

async function saveChiefComplaint() {
  const encounterId = props.encounter?.id
  if (encounterId == null || !props.canEdit || saving.value) {
    return
  }
  const next = String(chiefComplaintDraft.value ?? '').trim()
  if (next === lastSavedComplaint.value) {
    return
  }
  saving.value = true
  try {
    const updated = await patchEncounter(encounterId, {
      chiefComplaint: next,
    })
    lastSavedComplaint.value = next
    chiefComplaintDraft.value = resolveChiefComplaint(updated) || next
    emit('chief-complaint-saved', updated)
  } catch (error) {
    syncChiefComplaintFromEncounter()
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: encounterApiErrorMessage(
          error,
          t('encounterChiefComplaintSaveError'),
        ),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
  }
}

watch(
  () => props.encounter?.id,
  () => {
    syncChiefComplaintFromEncounter()
  },
  { immediate: true },
)

watch(
  () => props.encounter?.chiefComplaint,
  () => {
    if (saving.value) {
      return
    }
    const value = resolveChiefComplaint(props.encounter)
    if (value !== lastSavedComplaint.value) {
      syncChiefComplaintFromEncounter()
    }
  },
)
</script>
