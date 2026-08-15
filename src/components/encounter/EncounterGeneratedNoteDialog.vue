<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="emit('update:modelValue', $event)">
    <q-card
      class="insurance-dialog app-dialog-card app-dialog-card--lg"
      :data-testid="tid.generatedNote">
      <AppDialogHeader
        :close-label="t('close')"
        @close="emit('update:modelValue', false)">
        {{ note?.templateName || t('encounterGeneratedNoteTitle') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row items-center q-gutter-sm q-mb-md">
          <AdminTableStatusCell
            :label="statusLabel"
            :variant="statusVariant"
          />
          <span
            v-if="unsigned"
            class="text-body2 text-grey-7">
            {{ t('encounterGeneratedNoteReady') }}
          </span>
        </div>
        <div
          v-for="section in sections"
          :key="section.id || section.sectionKey"
          class="encounter-generated-note__section q-mb-md">
          <h3 class="text-subtitle1 q-mt-none q-mb-xs">
            {{ section.sectionLabel }}
          </h3>
          <p
            v-if="section.sourceLabel"
            class="text-caption text-grey-7 q-mb-xs">
            {{ t('encounterGeneratedNoteSource', {
              source: section.sourceLabel,
            }) }}
          </p>
          <p class="text-body2 q-mb-none encounter-generated-note__body">
            {{ section.contentText || '—' }}
          </p>
        </div>
        <div
          v-if="unsigned && canSign"
          class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="draw"
            :title="t('clinicalNoteSectionSignature')"
          />
          <SignatureCanvas
            v-model="signatureData"
            class="q-mt-md"
          />
          <p
            v-if="signatureError"
            class="text-negative text-caption q-mt-xs q-mb-none">
            {{ signatureError }}
          </p>
        </div>
        <ClinicalNoteAddendaSection
          v-if="!unsigned"
          :addenda="note?.addenda ?? []"
          :can-add="canSign"
          :adding="busy"
          @add="emit('add-addendum')"
        />
      </q-card-section>
      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('close')"
          @click="emit('update:modelValue', false)"
        />
        <q-btn
          v-if="unsigned && canRegenerate"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :loading="busy"
          :label="t('encounterGeneratedNoteRegenerate')"
          :data-testid="tid.generatedNoteRegenerate"
          @click="emit('regenerate')"
        />
        <q-btn
          v-if="unsigned && canSign"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="busy"
          :label="t('clinicalNoteSign')"
          :data-testid="tid.generatedNoteSign"
          @click="onSign"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ClinicalNoteAddendaSection from
  'components/ClinicalNoteAddendaSection.vue'
import SignatureCanvas from 'components/SignatureCanvas.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import { clinicalNoteStatuses } from 'components/constants.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  note: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  canSign: { type: Boolean, default: false },
  canRegenerate: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'sign',
  'regenerate',
  'add-addendum',
])
const { t } = useI18n()
const signatureData = ref('')
const signatureError = ref('')

const sections = computed(() => props.note?.sections ?? [])
const unsigned = computed(() => {
  const status = String(props.note?.status ?? '').toUpperCase()

  return status !== clinicalNoteStatuses.signed
})
const statusLabel = computed(() => {
  const status = String(props.note?.status ?? '').toUpperCase()
  if (status === clinicalNoteStatuses.signed) {
    return t('clinicalNoteStatusSigned')
  }
  if (status === clinicalNoteStatuses.generated) {
    return t('clinicalNoteStatusGenerated')
  }

  return t('clinicalNoteStatusDraft')
})
const statusVariant = computed(() => {
  if (!unsigned.value) {
    return 'active'
  }

  return 'pending'
})

watch(
  () => props.modelValue,
  open => {
    if (open) {
      signatureData.value = ''
      signatureError.value = ''
    }
  },
)

function onSign() {
  if (!signatureData.value) {
    signatureError.value = t('clinicalNoteSignatureRequired')

    return
  }
  signatureError.value = ''
  emit('sign', signatureData.value)
}
</script>

<style lang="scss" scoped>
.encounter-generated-note__body {
  white-space: pre-wrap;
}
</style>
