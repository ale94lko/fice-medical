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
        test-id="encounter-generated-note"
        :close-label="t('close')"
        @close="emit('update:modelValue', false)">
        {{ note?.templateName || t('encounterGeneratedNoteTitle') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row items-center q-gutter-sm q-mb-sm">
          <AdminTableStatusCell
            :label="statusLabel"
            :variant="statusVariant"
          />
          <span
            v-if="unsigned && !stale"
            class="text-body2 text-grey-7">
            {{ t('encounterGeneratedNoteReady') }}
          </span>
        </div>
        <p
          v-if="dateOfServiceLabel"
          class="text-body2 text-grey-7 q-mb-xs">
          {{ dateOfServiceLabel }}
        </p>
        <p
          v-if="providerLabel"
          class="text-body2 text-grey-7 q-mb-md">
          {{ providerLabel }}
        </p>
        <p
          v-if="signedByLabel"
          class="text-body2 text-grey-7 q-mb-xs">
          {{ signedByLabel }}
        </p>
        <p
          v-if="signedAtLabel"
          class="text-body2 text-grey-7 q-mb-md">
          {{ signedAtLabel }}
        </p>
        <div
          v-if="stale"
          class="encounter-workspace-billing__banner
            encounter-workspace-billing__banner--alert q-mb-md"
          :data-testid="tid.generatedNoteStale">
          <q-icon name="warning" color="warning" size="20px" />
          <div>
            <p class="q-mb-xs">
              {{ t('encounterGeneratedNoteStaleTitle') }}
            </p>
            <p class="q-mb-none">
              {{ t('encounterGeneratedNoteStaleBody') }}
            </p>
          </div>
        </div>
        <div
          v-for="(block, blockIndex) in groupedSections"
          :key="block.group || `note-block-${blockIndex}`"
          class="encounter-generated-note__group q-mb-md">
          <h3
            v-if="block.headingKey"
            class="text-subtitle1 q-mt-none q-mb-sm">
            {{ t(block.headingKey) }}
          </h3>
          <div
            v-for="section in block.fields"
            :key="section.id || section.sectionKey"
            class="encounter-generated-note__section q-mb-md">
          <div class="row items-start justify-between q-col-gutter-sm">
            <div class="col">
              <h3
                v-if="!block.headingKey"
                class="text-subtitle1 q-mt-none q-mb-xs">
                {{ section.sectionLabel }}
              </h3>
              <p
                v-else
                class="text-subtitle2 q-mt-none q-mb-xs">
                {{ section.sectionLabel }}
              </p>
            </div>
            <q-btn
              v-if="showEditSource(section)"
              no-caps
              flat
              dense
              color="primary"
              class="col-auto"
              :label="t('encounterGeneratedNoteEditSource')"
              :data-testid="tid.generatedNoteEditSource(
                section.sectionKey,
              )"
              @click="onEditSource(section)"
            />
          </div>
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
        </div>
        <div
          v-if="unsigned && canSign && !stale"
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
          v-if="signedOrAmended"
          :addenda="note?.addenda ?? []"
          :can-add="canSign && !voided"
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
          :label="t('encounterGeneratedNoteBack')"
          :data-testid="tid.generatedNoteClose"
          @click="emit('update:modelValue', false)"
        />
        <q-btn
          v-if="unsigned && canRegenerate"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :loading="busy"
          :label="stale
            ? t('encounterGeneratedNoteRegenerateShort')
            : t('encounterGeneratedNoteRegenerate')"
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
          :disable="stale"
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
  'src/test-ids/index.js'
import { formatDateTime } from 'src/utils/app-datetime.js'
import { groupGeneratedNoteSections } from
  'src/utils/clinical-note-narrative-group.js'
import { resolveGeneratedNoteEditSource } from
  'src/utils/generated-note-edit-source.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  note: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  canSign: { type: Boolean, default: false },
  canRegenerate: { type: Boolean, default: false },
  canCorrectSources: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'sign',
  'regenerate',
  'add-addendum',
  'edit-source',
])
const { t } = useI18n()
const signatureData = ref('')
const signatureError = ref('')

const sections = computed(() => props.note?.sections ?? [])
const groupedSections = computed(() =>
  groupGeneratedNoteSections(sections.value))
const unsigned = computed(() => {
  const status = String(props.note?.status ?? '').toUpperCase()

  return status !== clinicalNoteStatuses.signed
    && status !== clinicalNoteStatuses.amended
    && status !== clinicalNoteStatuses.voided
})
const signedOrAmended = computed(() => {
  const status = String(props.note?.status ?? '').toUpperCase()

  return status === clinicalNoteStatuses.signed
    || status === clinicalNoteStatuses.amended
})
const voided = computed(() => {
  const status = String(props.note?.status ?? '').toUpperCase()

  return status === clinicalNoteStatuses.voided
})
const stale = computed(() =>
  unsigned.value && Boolean(props.note?.regenerationRequired))
const statusLabel = computed(() => {
  const status = String(props.note?.status ?? '').toUpperCase()
  if (status === clinicalNoteStatuses.signed) {
    return t('clinicalNoteStatusSigned')
  }
  if (status === clinicalNoteStatuses.amended) {
    return t('clinicalNoteStatusAmended')
  }
  if (status === clinicalNoteStatuses.voided) {
    return t('clinicalNoteStatusVoided')
  }
  if (status === clinicalNoteStatuses.generated) {
    return t('clinicalNoteStatusGenerated')
  }

  return t('clinicalNoteStatusDraft')
})
const statusVariant = computed(() => {
  if (voided.value) {
    return 'inactive'
  }
  if (stale.value) {
    return 'pending'
  }
  if (!unsigned.value) {
    return 'active'
  }

  return 'pending'
})
const dateOfServiceLabel = computed(() => {
  const raw = props.note?.noteDateTime || props.note?.generatedAt
  const formatted = formatDateTime(raw)
  if (!formatted) {
    return ''
  }

  return t('encounterGeneratedNoteDateOfService', { date: formatted })
})
const providerLabel = computed(() => {
  const name = String(props.note?.providerName ?? '').trim()
  if (!name) {
    return ''
  }

  return t('encounterGeneratedNoteProvider', { name })
})
const signedByLabel = computed(() => {
  if (!signedOrAmended.value) {
    return ''
  }
  const name = String(props.note?.providerName ?? '').trim()
  if (!name) {
    return ''
  }

  return t('encounterGeneratedNoteSignedBy', { name })
})
const signedAtLabel = computed(() => {
  if (!signedOrAmended.value) {
    return ''
  }
  const formatted = formatDateTime(props.note?.signedAt)
  if (!formatted) {
    return ''
  }

  return t('encounterGeneratedNoteSignedAt', { date: formatted })
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

function showEditSource(section) {
  return unsigned.value
    && props.canCorrectSources
    && Boolean(resolveGeneratedNoteEditSource(section))
}

function onEditSource(section) {
  const target = resolveGeneratedNoteEditSource(section)
  if (!target) {
    return
  }
  emit('edit-source', target)
}

function onSign() {
  if (stale.value) {
    return
  }
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
