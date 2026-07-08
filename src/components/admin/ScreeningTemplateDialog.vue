<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog screening-template-dialog app-dialog-card"
      :data-testid="screeningTemplateDialogTestIds.dialog">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md
          screening-template-dialog__body">
        <p
          v-if="dialogSubtitle"
          class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ dialogSubtitle }}
        </p>

        <ScreeningTemplatePreview
          v-if="viewMode === 'preview'"
          :template="local"
        />

        <q-banner
          v-if="showLockedBanner && viewMode === 'editor'"
          dense
          rounded
          class="screening-template-dialog__banner q-mb-md">
          <template #avatar>
            <q-icon name="lock" color="warning" />
          </template>
          {{ t('screeningTemplateInUseWarning') }}
        </q-banner>

        <div
          v-show="viewMode === 'editor'"
          class="screening-template-dialog__general">
          <SubsectionHeading
            icon="assignment"
            :title="t('screeningTemplateSectionGeneral')"
          />
          <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('screeningTemplateNameLabel')"
              required>
              <TextInput
                v-model="local.name"
                :external-label="true"
                :readonly="readonly"
                :error="Boolean(errors.fields.name)"
                :error-message="errors.fields.name"
                :test-id="screeningTemplateDialogTestIds.field('name')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('screeningTemplateCategoryLabel')">
              <TextInput
                v-model="local.category"
                :external-label="true"
                :readonly="readonly"
                :test-id="screeningTemplateDialogTestIds.field('category')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('screeningTemplateStatusLabel')">
              <FormSelect
                v-model="local.status"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :options="statusOptions"
                :readonly="readonly"
                :test-id="screeningTemplateDialogTestIds.field('status')"
              />
            </AddClientLabeledField>
          </div>
          <div v-if="showCopyField" class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('screeningTemplateCopyFromLabel')">
              <FormSelect
                :model-value="copyFromId"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :options="copySources"
                :loading="copyLoading"
                :disable="copyLoading"
                :placeholder="t('screeningTemplateCopyFromPlaceholder')"
                :test-id="screeningTemplateDialogTestIds.field('copy-from')"
                @update:model-value="onCopyFromSelected"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('screeningTemplateDescriptionLabel')">
              <TextInput
                v-model="local.description"
                type="textarea"
                autogrow
                class="screening-template-dialog__desc"
                :external-label="true"
                :readonly="readonly"
                :test-id="screeningTemplateDialogTestIds.field('description')"
              />
            </AddClientLabeledField>
          </div>
          </div>
        </div>

        <div
          v-show="viewMode === 'editor'"
          class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center justify-between q-mb-sm">
            <SubsectionHeading
              icon="list_alt"
              :title="t('screeningTemplateSectionStructure')"
            />
            <q-btn
              v-if="!structureLocked"
              no-caps
              flat
              dense
              color="primary"
              icon="add"
              :label="t('screeningTemplateAddSection')"
              :data-testid="screeningTemplateDialogTestIds.addSection"
              @click="addSection"
            />
          </div>

          <p
            v-if="errors.fields.sections"
            class="text-negative text-caption q-mb-sm">
            {{ errors.fields.sections }}
          </p>

          <div
            v-for="(section, sIndex) in local.sections"
            :key="section.key"
            class="screening-template-dialog__section q-mb-md">
            <div class="row items-start q-col-gutter-md">
              <div class="col">
                <AddClientLabeledField
                  :label="t('screeningTemplateSectionTitleLabel')"
                  required>
                  <TextInput
                    v-model="section.title"
                    :external-label="true"
                    :readonly="structureLocked"
                    :error="Boolean(sectionError(section)?.title)"
                    :error-message="sectionError(section)?.title"
                    :test-id="screeningTemplateDialogTestIds
                      .sectionField(sIndex, 'title')"
                  />
                </AddClientLabeledField>
              </div>
              <div
                v-if="!structureLocked"
                class="col-auto screening-template-dialog__section-remove
                  row items-center no-wrap">
                <q-btn
                  flat
                  dense
                  round
                  color="grey-7"
                  icon="keyboard_arrow_up"
                  :disable="sIndex === 0"
                  :aria-label="t('screeningTemplateMoveSectionUp')"
                  :data-testid="screeningTemplateDialogTestIds
                    .moveSectionUp(sIndex)"
                  @click="moveSection(sIndex, -1)"
                />
                <q-btn
                  flat
                  dense
                  round
                  color="grey-7"
                  icon="keyboard_arrow_down"
                  :disable="sIndex === local.sections.length - 1"
                  :aria-label="t('screeningTemplateMoveSectionDown')"
                  :data-testid="screeningTemplateDialogTestIds
                    .moveSectionDown(sIndex)"
                  @click="moveSection(sIndex, 1)"
                />
                <q-btn
                  flat
                  dense
                  round
                  color="negative"
                  icon="delete_outline"
                  :aria-label="t('screeningTemplateRemoveSection')"
                  :data-testid="screeningTemplateDialogTestIds
                    .removeSection(sIndex)"
                  @click="removeSection(sIndex)"
                />
              </div>
            </div>

            <AddClientLabeledField
              class="q-mt-sm"
              :label="t('screeningTemplateSectionDescriptionLabel')">
              <TextInput
                v-model="section.description"
                type="textarea"
                autogrow
                class="screening-template-dialog__desc"
                :external-label="true"
                :readonly="structureLocked"
              />
            </AddClientLabeledField>

            <p
              v-if="sectionError(section)?.empty"
              class="text-negative text-caption q-mt-sm q-mb-none">
              {{ sectionError(section).empty }}
            </p>

            <div class="screening-template-dialog__questions q-mt-md">
              <div
                v-for="(question, qIndex) in section.questions"
                :key="question.key"
                class="screening-template-dialog__question">
                <div class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-grey-7">
                    {{ t('screeningTemplateQuestionNumber', {
                      number: qIndex + 1,
                    }) }}
                  </span>
                  <div v-if="!structureLocked" class="row items-center no-wrap">
                    <q-btn
                      flat
                      dense
                      round
                      size="sm"
                      color="grey-7"
                      icon="keyboard_arrow_up"
                      :disable="qIndex === 0"
                      :aria-label="t('screeningTemplateMoveQuestionUp')"
                      :data-testid="screeningTemplateDialogTestIds
                        .moveQuestionUp(sIndex, qIndex)"
                      @click="moveQuestion(section, qIndex, -1)"
                    />
                    <q-btn
                      flat
                      dense
                      round
                      size="sm"
                      color="grey-7"
                      icon="keyboard_arrow_down"
                      :disable="qIndex === section.questions.length - 1"
                      :aria-label="t('screeningTemplateMoveQuestionDown')"
                      :data-testid="screeningTemplateDialogTestIds
                        .moveQuestionDown(sIndex, qIndex)"
                      @click="moveQuestion(section, qIndex, 1)"
                    />
                    <q-btn
                      flat
                      dense
                      round
                      size="sm"
                      color="negative"
                      icon="close"
                      :aria-label="t('screeningTemplateRemoveQuestion')"
                      :data-testid="screeningTemplateDialogTestIds
                        .removeQuestion(sIndex, qIndex)"
                      @click="removeQuestion(section, qIndex)"
                    />
                  </div>
                </div>
                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-md-6">
                    <AddClientLabeledField
                      :label="t('screeningTemplateQuestionLabelLabel')"
                      required>
                      <TextInput
                        v-model="question.label"
                        :external-label="true"
                        :readonly="structureLocked"
                        :error="Boolean(
                          questionError(section, question)?.label,
                        )"
                        :error-message="questionError(section, question)?.label"
                      />
                    </AddClientLabeledField>
                  </div>
                  <div class="col-12 col-md-6">
                    <AddClientLabeledField
                      :label="t('screeningTemplateQuestionTypeLabel')">
                      <FormSelect
                        :model-value="question.fieldType"
                        outlined
                        hide-bottom-space
                        emit-value
                        map-options
                        :clearable="false"
                        :options="fieldTypeOptions"
                        :readonly="structureLocked"
                        @update:model-value="value =>
                          onFieldTypeChange(question, value)"
                      />
                    </AddClientLabeledField>
                  </div>
                  <div class="col-12">
                    <AddClientLabeledField
                      :label="t('screeningTemplateQuestionHelpLabel')">
                      <TextInput
                        v-model="question.helpText"
                        :external-label="true"
                        :readonly="structureLocked"
                      />
                    </AddClientLabeledField>
                  </div>
                  <div class="col-12">
                    <FormToggle
                      v-model="question.required"
                      :disable="structureLocked"
                      :label="t('screeningTemplateQuestionRequiredLabel')"
                    />
                  </div>
                </div>

                <div
                  v-if="fieldTypeRequiresOptions(question.fieldType)"
                  class="screening-template-dialog__options q-mt-sm">
                  <span class="text-caption text-weight-medium">
                    {{ t('screeningTemplateOptionsLabel') }}
                  </span>
                  <p
                    v-if="questionError(section, question)?.options"
                    class="text-negative text-caption q-mb-xs">
                    {{ questionError(section, question).options }}
                  </p>
                  <div
                    v-for="(option, oIndex) in question.options"
                    :key="oIndex"
                    class="row items-center q-col-gutter-sm q-mb-xs no-wrap">
                    <div class="col">
                      <TextInput
                        :model-value="option"
                        :external-label="true"
                        :readonly="structureLocked"
                        :placeholder="t('screeningTemplateOptionPlaceholder')"
                        @update:model-value="value =>
                          setOption(question, oIndex, value)"
                      />
                    </div>
                    <div v-if="!structureLocked" class="col-auto">
                      <q-btn
                        flat
                        dense
                        round
                        size="sm"
                        color="negative"
                        icon="close"
                        :aria-label="t('screeningTemplateRemoveOption')"
                        @click="removeOption(question, oIndex)"
                      />
                    </div>
                  </div>
                  <q-btn
                    v-if="!structureLocked"
                    no-caps
                    flat
                    dense
                    size="sm"
                    color="primary"
                    icon="add"
                    :label="t('screeningTemplateAddOption')"
                    @click="addOption(question)"
                  />
                </div>
              </div>

              <q-btn
                v-if="!structureLocked"
                no-caps
                outline
                dense
                color="primary"
                class="app-btn-outline q-mt-sm"
                icon="add"
                :label="t('screeningTemplateAddQuestion')"
                :data-testid="screeningTemplateDialogTestIds
                  .addQuestion(sIndex)"
                @click="addQuestion(section)"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions
        class="app-dialog-card__actions screening-template-dialog__actions">
        <q-btn-toggle
          v-model="viewMode"
          no-caps
          unelevated
          toggle-color="primary"
          color="grey-3"
          text-color="grey-8"
          class="screening-template-dialog__view-toggle"
          :options="viewModeOptions"
        />
        <q-space />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          :data-testid="screeningTemplateDialogTestIds.btn('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :label="t('save')"
          :data-testid="screeningTemplateDialogTestIds.btn('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="copyConfirmOpen" persistent>
    <q-card
      class="screening-template-copy-confirm"
      :data-testid="screeningTemplateDialogTestIds.copyConfirm">
      <q-card-section class="row items-start no-wrap q-gutter-md">
        <q-icon name="warning" color="warning" size="28px" />
        <div>
          <div class="text-subtitle1 text-weight-medium">
            {{ t('screeningTemplateCopyConfirmTitle') }}
          </div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            {{ t('screeningTemplateCopyConfirmMessage') }}
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="screening-template-copy-confirm__actions">
        <q-btn
          no-caps
          flat
          color="grey-8"
          :label="t('screeningTemplateCopyKeep')"
          :data-testid="screeningTemplateDialogTestIds.copyConfirmBtn('keep')"
          @click="closeCopyConfirm"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('screeningTemplateCopyAppend')"
          :data-testid="screeningTemplateDialogTestIds.copyConfirmBtn('append')"
          @click="onCopyAppendConfirmed"
        />
        <q-btn
          no-caps
          unelevated
          color="negative"
          :label="t('screeningTemplateCopyReplace')"
          :data-testid="screeningTemplateDialogTestIds
            .copyConfirmBtn('replace')"
          @click="onCopyReplaceConfirmed"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  screeningTemplateStatusValues,
} from 'components/constants.js'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import ScreeningTemplatePreview from
  'components/admin/ScreeningTemplatePreview.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import TextInput from 'components/TextInput.vue'
import {
  buildScreeningFieldTypeOptions,
  buildScreeningTemplateStatusOptions,
} from 'src/composables/useScreeningTemplatePermissions.js'
import {
  cloneScreeningTemplateForm,
  createEmptyQuestionForm,
  createEmptyScreeningTemplateForm,
  createEmptySectionForm,
  fieldTypeRequiresOptions,
  screeningTemplateFormHasContent,
  screeningTemplateFormHasErrors,
  validateScreeningTemplateForm,
} from 'src/utils/screening-template-form.js'
import {
  fetchManageScreeningTemplate,
  screeningTemplateApiErrorMessage,
} from 'src/utils/screening-template-api.js'
import { screeningTemplateDialogTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: {
    type: String,
    default: 'add',
    validator: value => ['add', 'edit', 'view'].includes(value),
  },
  template: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  copySources: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])
const { t } = useI18n()
const $q = useQuasar()

const local = ref(createEmptyScreeningTemplateForm())
const errors = ref({ fields: {}, sections: {} })
const copyFromId = ref(null)
const copyLoading = ref(false)
const viewMode = ref('editor')
const copyConfirmOpen = ref(false)
const pendingCopySource = ref(null)

const viewModeOptions = computed(() => [
  { label: t('screeningTemplateEditorTab'), value: 'editor' },
  { label: t('screeningTemplatePreviewTab'), value: 'preview' },
])

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')
const structureLocked = computed(() =>
  readonly.value || (props.mode === 'edit' && local.value.inUse),
)
const showLockedBanner = computed(() =>
  props.mode === 'edit' && local.value.inUse,
)
const showCopyField = computed(() =>
  props.mode === 'add' && props.copySources.length > 0,
)

const fieldTypeOptions = computed(() => buildScreeningFieldTypeOptions(t))
const statusOptions = computed(() => buildScreeningTemplateStatusOptions(t))

const dialogTitle = computed(() => {
  if (props.mode === 'add') {
    return t('screeningTemplateDialogAddTitle')
  }
  if (props.mode === 'edit') {
    return t('screeningTemplateDialogEditTitle')
  }

  return t('screeningTemplateDialogViewTitle')
})

const dialogSubtitle = computed(() => {
  if (props.mode === 'add') {
    return t('screeningTemplateDialogAddSubtitle')
  }
  if (props.mode === 'edit') {
    return t('screeningTemplateDialogEditSubtitle')
  }

  return ''
})

function sectionError(section) {
  return errors.value.sections[section.key] ?? null
}

function questionError(section, question) {
  return sectionError(section)?.questions?.[question.key] ?? null
}

function resetErrors() {
  errors.value = { fields: {}, sections: {} }
}

function syncLocalFromProps() {
  if (props.template) {
    local.value = cloneScreeningTemplateForm(props.template)
  } else {
    local.value = createEmptyScreeningTemplateForm()
  }
  copyFromId.value = null
  viewMode.value = 'editor'
  resetErrors()
}

function toCopyForm(source, overrides = {}) {
  const cloned = cloneScreeningTemplateForm(source)

  return {
    ...cloned,
    id: null,
    inUse: false,
    status: screeningTemplateStatusValues.active,
    name: overrides.name ?? '',
    description: overrides.description ?? '',
    sections: cloned.sections.map(section => ({
      ...section,
      id: null,
      questions: section.questions.map(question => ({
        ...question,
        id: null,
      })),
    })),
  }
}

function applyCopyReplace(source) {
  local.value = toCopyForm(source)
  resetErrors()
}

function applyCopyAppend(source) {
  const copied = toCopyForm(source)
  local.value.sections.push(...copied.sections)
  resetErrors()
}

function closeCopyConfirm() {
  copyConfirmOpen.value = false
  pendingCopySource.value = null
  copyFromId.value = null
}

function onCopyReplaceConfirmed() {
  if (pendingCopySource.value) {
    applyCopyReplace(pendingCopySource.value)
  }
  closeCopyConfirm()
}

function onCopyAppendConfirmed() {
  if (pendingCopySource.value) {
    applyCopyAppend(pendingCopySource.value)
  }
  closeCopyConfirm()
}

async function onCopyFromSelected(id) {
  copyFromId.value = id
  if (id == null) {
    return
  }
  copyLoading.value = true
  try {
    const source = await fetchManageScreeningTemplate(id)
    if (screeningTemplateFormHasContent(local.value)) {
      pendingCopySource.value = source
      copyConfirmOpen.value = true
    } else {
      applyCopyReplace(source)
    }
  } catch (error) {
    copyFromId.value = null
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: screeningTemplateApiErrorMessage(
        error, t('screeningTemplateCopyError'),
      ),
    })
  } finally {
    copyLoading.value = false
  }
}

watch(
  () => [props.modelValue, props.template, props.mode],
  () => {
    if (props.modelValue) {
      syncLocalFromProps()
    }
  },
  { immediate: true },
)

function addSection() {
  local.value.sections.push(createEmptySectionForm())
}

function removeSection(index) {
  local.value.sections.splice(index, 1)
}

function moveSection(index, delta) {
  const target = index + delta
  const sections = local.value.sections
  if (target < 0 || target >= sections.length) {
    return
  }
  const [moved] = sections.splice(index, 1)
  sections.splice(target, 0, moved)
}

function addQuestion(section) {
  section.questions.push(createEmptyQuestionForm())
}

function removeQuestion(section, index) {
  section.questions.splice(index, 1)
}

function moveQuestion(section, index, delta) {
  const target = index + delta
  if (target < 0 || target >= section.questions.length) {
    return
  }
  const questions = section.questions
  const [moved] = questions.splice(index, 1)
  questions.splice(target, 0, moved)
}

function onFieldTypeChange(question, value) {
  question.fieldType = value
  if (fieldTypeRequiresOptions(value) && !question.options.length) {
    question.options = ['']
  }
}

function addOption(question) {
  question.options.push('')
}

function setOption(question, index, value) {
  question.options[index] = value
}

function removeOption(question, index) {
  question.options.splice(index, 1)
}

function onCancel() {
  emit('cancel')
  open.value = false
}

function onSave() {
  const nextErrors = validateScreeningTemplateForm(local.value, t, {
    validateStructure: !structureLocked.value,
  })
  errors.value = nextErrors
  if (screeningTemplateFormHasErrors(nextErrors)) {
    viewMode.value = 'editor'

    return
  }
  emit('save', {
    form: cloneScreeningTemplateForm(local.value),
    includeStructure: !structureLocked.value,
  })
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.screening-template-dialog {
  &__body {
    max-height: min(78vh, 760px);
    overflow-y: auto;
  }

  &__banner {
    background: rgba($warning, 0.12);
    color: $text-strong;
  }

  &__actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  &__view-toggle {
    border: 1px solid $border-subtle;
    border-radius: $radius-md;
    overflow: hidden;
  }

  &__desc :deep(textarea.q-field__native) {
    min-height: 80px !important;
    max-height: 80px;
  }

  &__general {
    border: 1px solid rgba($positive, 0.35);
    border-radius: $radius-md;
    background: rgba($positive, 0.06);
    padding: 16px;
  }

  &__section {
    border: 1px solid $border-subtle;
    border-radius: $radius-md;
    padding: 16px;
    background: $surface;
  }

  &__question {
    border: 1px solid $border-subtle;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    background: rgba($primary, 0.02);
  }

  &__options {
    border-left: 2px solid rgba($primary, 0.16);
    padding-left: 12px;
  }
}

.screening-template-copy-confirm {
  width: 100%;
  max-width: 460px;

  &__actions {
    gap: 8px;
    flex-wrap: wrap;
  }
}
</style>
