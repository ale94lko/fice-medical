<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="emit('update:modelValue', $event)">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="emit('update:modelValue', false)">
        {{ t('clinicalNoteTemplatePreview') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clinicalNoteTemplatePreviewHint') }}
        </p>
        <h3 class="text-subtitle1 q-mt-none">
          {{ template?.name || t('clinicalNoteTemplatePreviewUntitled') }}
        </h3>
        <div
          v-for="(section, index) in sections"
          :key="section.uid || index"
          class="q-mb-md">
          <div class="row items-center q-gutter-sm">
            <strong>{{ index + 1 }}. {{ section.label }}</strong>
            <q-badge outline color="primary">
              {{ typeLabel(section.sectionType) }}
            </q-badge>
            <q-badge
              v-if="section.required"
              outline
              color="orange">
              {{ t('clinicalNoteTemplateRequired') }}
            </q-badge>
            <q-badge
              v-if="section.showWhenEmpty === false"
              outline
              color="grey">
              {{ t('clinicalNoteTemplateHideWhenEmpty') }}
            </q-badge>
          </div>
          <p class="text-body2 text-grey-7 q-mb-none q-mt-xs">
            {{ previewBody(section) }}
          </p>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('close')"
          @click="emit('update:modelValue', false)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import { clinicalNoteSectionTypes as types } from
  'src/composables/useClinicalNoteTemplatePermissions.js'
import {
  parseStructuredSectionFields,
} from 'src/utils/clinical-note-template-api.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  template: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const sections = computed(() => props.template?.sections ?? [])

function typeLabel(type) {
  if (type === types.autoData) {
    return t('clinicalNoteSectionAutoData')
  }
  if (type === types.narrativeField) {
    return t('clinicalNoteSectionNarrative')
  }
  if (type === types.assessment) {
    return t('clinicalNoteSectionAssessment')
  }
  if (type === types.structuredSection) {
    return t('clinicalNoteSectionStructured')
  }

  return type
}

function previewBody(section) {
  if (section.sectionType === types.autoData) {
    return t('clinicalNotePreviewAuto', {
      source: section.dataSource || '—',
    })
  }
  if (section.sectionType === types.narrativeField) {
    return section.placeholder
      || t('clinicalNotePreviewNarrative')
  }
  if (section.sectionType === types.assessment) {
    return t('clinicalNotePreviewAssessment')
  }

  if (section.sectionType === types.structuredSection) {
    const rawFields = Array.isArray(section.structuredFields)
      && section.structuredFields.length
      ? section.structuredFields
      : parseStructuredSectionFields(section.configurationJson)
    const names = rawFields
      .map(item => item.label)
      .filter(Boolean)
      .join(', ')
    if (names) {
      return t('clinicalNotePreviewStructuredFields', {
        fields: names,
      })
    }

    return t('clinicalNotePreviewStructured')
  }

  return t('clinicalNotePreviewStructured')
}
</script>
