<template>
  <div
    class="encounter-workspace-note"
    :data-testid="tid.note">
    <section class="encounter-workspace-card">
      <div class="encounter-workspace-card__head">
        <div>
          <h2>{{ t('encounterProgressNote') }}</h2>
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ t('encounterNoteReuseHint') }}
          </p>
        </div>
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('encounterOpenNotes')"
          :data-testid="tid.noteOpen"
          @click="emit('open-notes')"
        />
      </div>
      <p class="text-body2 q-mb-none">
        {{ t('encounterClinicalCount', {
          count: sections?.notes ?? 0,
        }) }}
      </p>
    </section>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/index.js'

defineProps({
  sections: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['open-notes'])
const { t } = useI18n()
</script>
