<template>
  <div class="screening-template-preview">
    <header class="screening-template-preview__header">
      <h3 class="screening-template-preview__title">
        {{ template.name || t('screeningTemplateUntitledName') }}
      </h3>
      <div class="screening-template-preview__meta">
        <span v-if="template.category" class="screening-template-preview__chip">
          {{ template.category }}
        </span>
        <span class="screening-template-preview__chip">
          {{ t('screeningTemplateVersionLabel') }}: {{ template.version }}
        </span>
      </div>
      <p
        v-if="template.description"
        class="screening-template-preview__description text-body2 text-grey-7">
        {{ template.description }}
      </p>
    </header>

    <div
      v-if="previewSections.length"
      class="screening-template-preview__sections">
      <ScreeningDialogSection
        v-for="(section, sIndex) in previewSections"
        :key="section.key"
        :index="sIndex + 1"
        :title="section.title || t('screeningTemplateUntitledSection')"
        :description="section.description || ''">
        <ScreeningDynamicField
          v-for="question in section.questions"
          :key="question.previewId"
          :question="question"
          spaced
          :model-value="answers[question.previewId] ?? ''"
          @update:model-value="value => setAnswer(question.previewId, value)"
        />
        <p
          v-if="!section.questions.length"
          class="text-body2 text-grey-6 q-mb-none">
          {{ t('screeningTemplatePreviewNoQuestions') }}
        </p>
      </ScreeningDialogSection>
    </div>

    <div
      v-else
      class="screening-template-preview__empty text-grey-7">
      <q-icon name="visibility_off" size="md" />
      <span>{{ t('screeningTemplatePreviewEmpty') }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ScreeningDialogSection from 'components/ScreeningDialogSection.vue'
import ScreeningDynamicField from 'components/ScreeningDynamicField.vue'

const props = defineProps({
  template: {
    type: Object,
    default: () => ({}),
  },
})

const { t } = useI18n()
const answers = ref({})

function toPreviewQuestion(question) {
  const previewId = String(question.id || question.key)

  return {
    previewId,
    id: previewId,
    label: question.label || t('screeningTemplateUntitledQuestion'),
    helpText: question.helpText || '',
    fieldType: question.fieldType,
    required: Boolean(question.required),
    options: (question.options ?? []).filter(
      option => String(option ?? '').trim() !== '',
    ),
  }
}

const previewSections = computed(() =>
  (props.template.sections ?? []).map(section => ({
    key: section.key,
    title: section.title,
    description: section.description,
    questions: (section.questions ?? []).map(toPreviewQuestion),
  })),
)

function setAnswer(previewId, value) {
  answers.value = { ...answers.value, [previewId]: value }
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.screening-template-preview {
  &__header {
    margin-bottom: 16px;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 1.25rem;
    font-weight: 700;
    color: $text-strong;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba($primary, 0.1);
    color: $primary;
  }

  &__description {
    margin: 0;
  }

  &__sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 16px;
    text-align: center;
  }
}
</style>
