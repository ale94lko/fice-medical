<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(tid.dialog)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        :test-id="tid.dialog"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <FormField required :label="t('consentVersionLabel')">
              <TextInput
                v-model="local.version"
                outlined
                dense
                hide-bottom-space
                :readonly="readonly"
                :test-id="tid.field('version')"
                :maxlength="40"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField required :label="t('consentEffectiveDate')">
              <ClientDateField
                v-model="local.effectiveDate"
                :readonly="readonly"
                :test-id="tid.field('effective-date')"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField :label="t('consentExpirationDate')">
              <ClientDateField
                v-model="local.expirationDate"
                :readonly="readonly"
                :test-id="tid.field('expiration-date')"
              />
            </FormField>
            <p
              v-if="dateRangeInvalid"
              class="text-body2 text-negative q-mt-xs q-mb-none">
              {{ t('consentVersionDateRangeInvalid') }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <FormField :label="t('consentValidityYearsAfterSign')">
              <TextInput
                v-model="local.validityYearsAfterSign"
                outlined
                dense
                hide-bottom-space
                type="number"
                :readonly="readonly"
                :test-id="tid.field('validity-years-after-sign')"
              />
            </FormField>
            <p class="text-body2 text-grey-7 q-mt-xs q-mb-none">
              {{ t('consentValidityYearsAfterSignHelp') }}
            </p>
          </div>
          <div class="col-12">
            <FormField required :label="t('consentContentHtml')">
              <q-input
                v-model="local.contentHtml"
                outlined
                type="textarea"
                autogrow
                :readonly="readonly"
                :data-testid="tid.field('content-html')"
                :placeholder="t('consentContentHtmlPlaceholder')"
              />
            </FormField>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center q-mb-md">
            <h3 class="text-subtitle1 q-mb-none col">
              {{ t('consentFieldsTitle') }}
            </h3>
            <q-btn
              v-if="!readonly"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="add"
              :label="t('consentFieldAdd')"
              :data-testid="tid.addField"
              @click="openAddField"
            />
          </div>
          <p
            v-if="!local.fields.length"
            class="text-body2 text-grey-7 q-mb-none">
            {{ t('consentFieldsEmpty') }}
          </p>
          <div
            v-else
            class="q-gutter-y-sm">
            <article
              v-for="(field, index) in local.fields"
              :key="field.key || index"
              class="row items-center no-wrap q-pa-sm">
              <div class="col min-width-0">
                <div class="text-body2 text-weight-medium">
                  {{ field.label || field.key }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ fieldTypeLabel(field.fieldType) }}
                  <span v-if="field.required">
                    · {{ t('consentFieldRequired') }}
                  </span>
                  <span v-if="field.includeInDocument === false">
                    · {{ t('consentFieldExcludeFromDocument') }}
                  </span>
                </div>
              </div>
              <div
                v-if="!readonly"
                class="row q-gutter-xs no-wrap">
                <q-btn
                  flat
                  round
                  dense
                  icon="arrow_upward"
                  class="app-btn-icon-action"
                  :disable="index === 0"
                  :data-testid="tid.fieldMoveUp(field.key)"
                  :aria-label="t('consentFieldMoveUp')"
                  @click="moveField(index, -1)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="arrow_downward"
                  class="app-btn-icon-action"
                  :disable="index === local.fields.length - 1"
                  :data-testid="tid.fieldMoveDown(field.key)"
                  :aria-label="t('consentFieldMoveDown')"
                  @click="moveField(index, 1)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  class="app-btn-icon-action"
                  :data-testid="tid.fieldEdit(field.key)"
                  :aria-label="t('edit')"
                  @click="openEditField(index)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  class="app-btn-icon-action"
                  :data-testid="tid.fieldRemove(field.key)"
                  :aria-label="t('delete')"
                  @click="removeField(index)"
                />
              </div>
            </article>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center q-mb-md">
            <h3 class="text-subtitle1 q-mb-none col">
              {{ t('consentSignatureRequirementsTitle') }}
            </h3>
            <q-btn
              v-if="!readonly"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="add"
              :label="t('consentSignatureRequirementAdd')"
              :data-testid="tid.addRequirement"
              @click="openAddRequirement"
            />
          </div>
          <p
            v-if="!local.signatureRequirements.length"
            class="text-body2 text-grey-7 q-mb-none">
            {{ t('consentSignatureRequirementsEmpty') }}
          </p>
          <div
            v-else
            class="q-gutter-y-sm">
            <article
              v-for="(requirement, index) in local.signatureRequirements"
              :key="requirement.key || index"
              class="row items-center no-wrap q-pa-sm">
              <div class="col min-width-0">
                <div class="text-body2 text-weight-medium">
                  {{ requirement.label || requirement.key }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ requirementRolesLabel(requirement) }}
                  <span v-if="requirement.required">
                    · {{ t('consentSignatureRequirementRequired') }}
                  </span>
                  <span v-else>
                    · {{ t('consentSignatureRequirementOptional') }}
                  </span>
                </div>
              </div>
              <div
                v-if="!readonly"
                class="row q-gutter-xs no-wrap">
                <q-btn
                  flat
                  round
                  dense
                  icon="arrow_upward"
                  class="app-btn-icon-action"
                  :disable="index === 0"
                  :data-testid="tid.requirementMoveUp(requirement.key)"
                  :aria-label="t('consentFieldMoveUp')"
                  @click="moveRequirement(index, -1)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="arrow_downward"
                  class="app-btn-icon-action"
                  :disable="index === local.signatureRequirements.length - 1"
                  :data-testid="
                    tid.requirementMoveDown(requirement.key)
                  "
                  :aria-label="t('consentFieldMoveDown')"
                  @click="moveRequirement(index, 1)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  class="app-btn-icon-action"
                  :data-testid="tid.requirementEdit(requirement.key)"
                  :aria-label="t('edit')"
                  @click="openEditRequirement(index)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  class="app-btn-icon-action"
                  :data-testid="tid.requirementRemove(requirement.key)"
                  :aria-label="t('delete')"
                  @click="removeRequirement(index)"
                />
              </div>
            </article>
          </div>
        </div>

        <ConsentDocumentLayoutEditor
          v-model="local.layout"
          :fields="local.fields"
          :signature-requirements="local.signatureRequirements"
          :readonly="readonly"
        />
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('consentContentPreviewTitle')"
          :data-testid="tid.preview"
          @click="previewOpen = true"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :loading="pdfPreviewing"
          :label="t('documentLayoutPdfPreview')"
          :data-testid="tid.pdfPreview"
          @click="onPdfPreview"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          :disable="saving"
          :data-testid="modalTestIds.cancel(tid.dialog)"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('save')"
          :loading="saving"
          :disable="!canSave"
          :data-testid="tid.save"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>

    <ConsentContentPreviewDialog
      v-model="previewOpen"
      :content-html="local.contentHtml"
    />
    <ConsentVersionFieldDialog
      v-model="fieldEditorOpen"
      :field="editingField"
      :other-fields="otherFieldsForEditor"
      @save="onSaveField"
    />
    <ConsentVersionSignatureRequirementDialog
      v-model="requirementEditorOpen"
      :requirement="editingRequirement"
      @save="onSaveRequirement"
    />
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormField from 'components/FormField.vue'
import TextInput from 'components/TextInput.vue'
import ConsentContentPreviewDialog from
  'components/admin/ConsentContentPreviewDialog.vue'
import ConsentDocumentLayoutEditor from
  'components/admin/ConsentDocumentLayoutEditor.vue'
import ConsentVersionFieldDialog from
  'components/admin/ConsentVersionFieldDialog.vue'
import ConsentVersionSignatureRequirementDialog from
  'components/admin/ConsentVersionSignatureRequirementDialog.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import {
  consentVersionDialogTestIds as tid,
  modalTestIds,
} from 'src/test-ids/index.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { parseUsDateString, startOfDay } from 'src/utils/client-form.js'
import {
  consentApiErrorMessage,
  previewConsentVersionPdf,
} from 'src/utils/consent-api.js'
import {
  consentFieldTypeLabel,
  emptyConsentFieldDefinition,
  normalizeConsentFieldDefinition,
} from 'src/utils/consent-fields.js'
import { consentSignerTypeI18nKey } from 'src/utils/consent-i18n.js'
import {
  emptyConsentSignatureRequirement,
  normalizeConsentSignatureRequirement,
} from 'src/utils/consent-signature-requirements.js'
import { normalizeDocumentLayout } from 'src/utils/document-layout.js'
import { openClinicalResourceBlobPreview } from
  'src/utils/clinical-resource-document-actions.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'add' },
  version: { type: Object, default: null },
  templateId: { type: [Number, String], default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])
const { t, te } = useI18n()
const $q = useQuasar()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const previewOpen = ref(false)
const pdfPreviewing = ref(false)
const fieldEditorOpen = ref(false)
const requirementEditorOpen = ref(false)
const editingIndex = ref(-1)
const editingRequirementIndex = ref(-1)
const local = reactive(emptyVersion())

const readonly = computed(() => props.mode === 'view')
const dialogTitle = computed(() => {
  if (props.mode === 'edit') {
    return t('consentVersionEditTitle')
  }
  if (props.mode === 'view') {
    return t('consentVersionViewTitle')
  }

  return t('consentVersionAddTitle')
})

const dateRangeInvalid = computed(() => {
  const effective = parseUsDateString(local.effectiveDate)
  const expiration = parseUsDateString(local.expirationDate)
  if (!effective || !expiration) {
    return false
  }

  return startOfDay(expiration).getTime()
    < startOfDay(effective).getTime()
})

const canSave = computed(() => {
  if (!String(local.version ?? '').trim()) {
    return false
  }
  if (!String(local.effectiveDate ?? '').trim()) {
    return false
  }
  if (!String(local.contentHtml ?? '').trim()) {
    return false
  }
  if (dateRangeInvalid.value) {
    return false
  }

  return true
})

function emptyVersion() {
  return {
    version: '',
    effectiveDate: '',
    expirationDate: '',
    validityYearsAfterSign: null,
    contentHtml: '',
    fields: [],
    signatureRequirements: [],
    layout: null,
  }
}

const editingField = computed(() => {
  if (editingIndex.value < 0) {
    return emptyConsentFieldDefinition(local.fields.length)
  }

  return local.fields[editingIndex.value] || null
})

const otherFieldsForEditor = computed(() => local.fields.filter(
  (item, index) => index !== editingIndex.value && item.key,
))

function fieldTypeLabel(type) {
  return consentFieldTypeLabel(t, type)
}

function openAddField() {
  editingIndex.value = -1
  fieldEditorOpen.value = true
}

function openEditField(index) {
  editingIndex.value = index
  fieldEditorOpen.value = true
}

function onSaveField(payload) {
  const next = [...local.fields]
  if (editingIndex.value < 0) {
    next.push({
      ...payload,
      displayOrder: next.length,
    })
  } else {
    next.splice(editingIndex.value, 1, {
      ...next[editingIndex.value],
      ...payload,
    })
  }
  local.fields = next.map((item, index) => ({
    ...item,
    displayOrder: index,
  }))
}

function removeField(index) {
  local.fields = local.fields
    .filter((_, itemIndex) => itemIndex !== index)
    .map((item, itemIndex) => ({
      ...item,
      displayOrder: itemIndex,
    }))
}

function moveField(index, delta) {
  const target = index + delta
  if (target < 0 || target >= local.fields.length) {
    return
  }
  const next = [...local.fields]
  const [row] = next.splice(index, 1)
  next.splice(target, 0, row)
  local.fields = next.map((item, itemIndex) => ({
    ...item,
    displayOrder: itemIndex,
  }))
}

const editingRequirement = computed(() => {
  if (editingRequirementIndex.value < 0) {
    return emptyConsentSignatureRequirement(
      local.signatureRequirements.length,
    )
  }

  return local.signatureRequirements[editingRequirementIndex.value]
    || null
})

function requirementRolesLabel(requirement) {
  const types = Array.isArray(requirement?.allowedSignerTypes)
    ? requirement.allowedSignerTypes
    : []

  return types.map(type => {
    const key = consentSignerTypeI18nKey(type)

    return te(key) ? t(key) : type
  }).join(' / ')
}

function openAddRequirement() {
  editingRequirementIndex.value = -1
  requirementEditorOpen.value = true
}

function openEditRequirement(index) {
  editingRequirementIndex.value = index
  requirementEditorOpen.value = true
}

function onSaveRequirement(payload) {
  const next = [...local.signatureRequirements]
  if (editingRequirementIndex.value < 0) {
    next.push({
      ...payload,
      displayOrder: next.length,
    })
  } else {
    next.splice(editingRequirementIndex.value, 1, {
      ...next[editingRequirementIndex.value],
      ...payload,
    })
  }
  local.signatureRequirements = next.map((item, index) => ({
    ...item,
    displayOrder: index,
  }))
}

function removeRequirement(index) {
  local.signatureRequirements = local.signatureRequirements
    .filter((_, itemIndex) => itemIndex !== index)
    .map((item, itemIndex) => ({
      ...item,
      displayOrder: itemIndex,
    }))
}

function moveRequirement(index, delta) {
  const target = index + delta
  if (target < 0 || target >= local.signatureRequirements.length) {
    return
  }
  const next = [...local.signatureRequirements]
  const [row] = next.splice(index, 1)
  next.splice(target, 0, row)
  local.signatureRequirements = next.map((item, itemIndex) => ({
    ...item,
    displayOrder: itemIndex,
  }))
}

function syncFromProps() {
  const source = props.version ?? {}
  Object.assign(local, emptyVersion(), {
    version: source.version ?? '',
    effectiveDate: source.effectiveDate ?? '',
    expirationDate: source.expirationDate ?? '',
    validityYearsAfterSign: source.validityYearsAfterSign ?? null,
    contentHtml: source.contentHtml ?? '',
    fields: Array.isArray(source.fields)
      ? source.fields.map((item, index) => (
        normalizeConsentFieldDefinition(item, index)
      ))
      : [],
    signatureRequirements: Array.isArray(source.signatureRequirements)
      ? source.signatureRequirements.map((item, index) => (
        normalizeConsentSignatureRequirement(item, index)
      ))
      : [],
    layout: normalizeDocumentLayout(source.layout),
  })
}

watch(
  () => [open.value, props.version, props.mode],
  ([isOpen]) => {
    if (isOpen) {
      syncFromProps()
    }
  },
)

function onCancel() {
  open.value = false
}

async function onPdfPreview() {
  if (!props.templateId || !props.version?.id) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('documentLayoutPreviewSaveFirst'),
    })
    return
  }
  if (!local.layout) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('documentLayoutPreviewMissing'),
    })
    return
  }
  pdfPreviewing.value = true
  try {
    const result = await previewConsentVersionPdf(
      props.templateId,
      props.version.id,
      local,
    )
    openClinicalResourceBlobPreview(result.blob)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: consentApiErrorMessage(
          error,
          t('documentLayoutPreviewError'),
        ),
      })
    }
  } finally {
    pdfPreviewing.value = false
  }
}

function onSave() {
  if (!canSave.value) {
    return
  }
  emit('save', { ...local })
}
</script>
