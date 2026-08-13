<template>
  <div
    class="encounter-workspace-visit"
    :data-testid="tid.visit">
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

    <section class="encounter-workspace-card">
      <div class="encounter-workspace-card__head">
        <h2>{{ t('encounterNotesSection') }}</h2>
        <q-btn
          v-if="canEdit"
          flat
          dense
          no-caps
          color="primary"
          :label="t('encounterAddNote')"
          @click="emit('add-note')"
        />
      </div>
      <p class="text-body2 text-grey-7 q-mb-none">
        {{ encounter?.notes || t('encounterNotesEmpty') }}
      </p>
    </section>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import EncounterDiagnosesEditor from
  'components/encounter/EncounterDiagnosesEditor.vue'
import EncounterServicesEditor from
  'components/encounter/EncounterServicesEditor.vue'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'

defineProps({
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
  'add-note',
  'services-saved',
  'diagnoses-saved',
])

const { t } = useI18n()
</script>
