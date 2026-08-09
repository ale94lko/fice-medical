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
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <FormField required :label="t('consentTemplateName')">
              <TextInput
                v-model="local.name"
                outlined
                dense
                hide-bottom-space
                :readonly="readonly"
                :test-id="tid.field('name')"
                :maxlength="consentNameMaxLength"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField required :label="t('consentTemplateType')">
              <FormSelect
                v-model="local.consentType"
                outlined
                dense
                emit-value
                map-options
                :options="typeOptions"
                :disable="readonly"
                :test-id="tid.field('type')"
              />
            </FormField>
          </div>
          <div class="col-12">
            <FormField :label="t('consentTemplateDescription')">
              <q-input
                v-model="local.description"
                outlined
                type="textarea"
                autogrow
                :readonly="readonly"
                :maxlength="consentDescriptionMaxLength"
                :data-testid="tid.field('description')"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-4">
            <FormToggle
              v-model="local.required"
              :disable="readonly"
              :label="t('consentTemplateRequired')"
              :test-id="tid.field('required')"
            />
          </div>
          <div class="col-12 col-md-4">
            <FormToggle
              v-model="local.signatureRequired"
              :disable="readonly"
              :label="t('consentTemplateSignatureRequired')"
              :test-id="tid.field('signature-required')"
            />
          </div>
          <div class="col-12 col-md-4">
            <FormToggle
              v-model="local.active"
              :disable="readonly"
              :label="t('consentTemplateActive')"
              :test-id="tid.field('active')"
            />
          </div>
          <div class="col-12">
            <FormField :label="t('consentAllowedSignerTypes')">
              <FormSelect
                v-model="local.allowedSignerTypes"
                outlined
                dense
                multiple
                emit-value
                map-options
                :options="signerOptions"
                :disable="readonly"
                :test-id="tid.field('signer-types')"
              />
            </FormField>
          </div>
        </div>

        <div
          v-if="templateId"
          class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center q-mb-md">
            <h3 class="text-subtitle1 q-mb-none col">
              {{ t('consentVersionsTitle') }}
            </h3>
            <q-btn
              v-if="canEditVersions"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="add"
              :label="t('consentVersionAdd')"
              :data-testid="tid.addVersion"
              @click="emit('add-version')"
            />
          </div>

          <div
            v-if="versionsLoading"
            class="row flex-center q-py-lg">
            <AppBrandLoading inline />
          </div>
          <div
            v-else-if="!versions.length"
            class="text-body2 text-grey-7 q-py-md">
            {{ t('consentVersionsEmpty') }}
          </div>
          <div
            v-else
            class="consent-template-dialog__versions q-gutter-y-sm">
            <article
              v-for="version in versions"
              :key="version.id"
              class="consent-template-dialog__version-row
                row items-center no-wrap q-pa-sm">
              <div class="col min-width-0">
                <div class="text-body2 text-weight-medium">
                  {{ version.version || '—' }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ versionStatusLabel(version.status) }}
                  · {{ formatConsentDate(version.effectiveDate) }}
                </div>
              </div>
              <div class="row q-gutter-xs no-wrap">
                <q-btn
                  flat
                  round
                  dense
                  icon="visibility"
                  class="app-btn-icon-action"
                  :data-testid="tid.versionPreview(version.id)"
                  :aria-label="t('view')"
                  @click="emit('preview-version', version)"
                />
                <q-btn
                  v-if="canEditVersion(version)"
                  flat
                  round
                  dense
                  icon="edit"
                  class="app-btn-icon-action"
                  :data-testid="tid.versionEdit(version.id)"
                  :aria-label="t('edit')"
                  @click="emit('edit-version', version)"
                />
                <q-btn
                  v-if="canPublishVersion(version)"
                  flat
                  round
                  dense
                  icon="publish"
                  class="app-btn-icon-action"
                  :data-testid="tid.versionPublish(version.id)"
                  :aria-label="t('consentVersionPublish')"
                  @click="emit('publish-version', version)"
                />
                <q-btn
                  v-if="canDeleteVersion(version)"
                  flat
                  round
                  dense
                  icon="delete"
                  class="app-btn-icon-action"
                  :data-testid="tid.versionDelete(version.id)"
                  :aria-label="t('delete')"
                  @click="emit('delete-version', version)"
                />
              </div>
            </article>
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          :disable="saving"
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
  </q-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppBrandLoading from 'components/AppBrandLoading.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import TextInput from 'components/TextInput.vue'
import {
  consentDescriptionMaxLength,
  consentNameMaxLength,
  consentSignerTypeValues,
  consentTypeValues,
  consentVersionStatusValues,
} from 'components/constants.js'
import {
  consentTemplateDialogTestIds as tid,
  modalTestIds,
} from 'src/test-ids/index.js'
import {
  buildConsentSignerTypeOptions,
  buildConsentTypeOptions,
  consentVersionStatusI18nKey,
  formatConsentDate,
} from 'src/utils/consent-i18n.js'
import { isConsentVersionEditable } from 'src/utils/consent-normalize.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'add' },
  template: { type: Object, default: null },
  versions: { type: Array, default: () => [] },
  versionsLoading: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  canEditVersions: { type: Boolean, default: false },
  canPublish: { type: Boolean, default: false },
  canDeleteVersions: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'save',
  'add-version',
  'edit-version',
  'preview-version',
  'publish-version',
  'delete-version',
])

const { t, te } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const local = reactive(emptyTemplate())
const readonly = computed(() => props.mode === 'view')
const templateId = computed(() => props.template?.id ?? null)

const typeOptions = computed(() => buildConsentTypeOptions(t, te))
const signerOptions = computed(() => buildConsentSignerTypeOptions(t, te))

const dialogTitle = computed(() => {
  if (props.mode === 'edit') {
    return t('consentTemplateEditTitle')
  }
  if (props.mode === 'view') {
    return t('consentTemplateViewTitle')
  }

  return t('consentTemplateAddTitle')
})

const canSave = computed(() => {
  if (!String(local.name ?? '').trim()) {
    return false
  }
  if (!local.consentType) {
    return false
  }

  return true
})

function emptyTemplate() {
  return {
    name: '',
    consentType: consentTypeValues.treatment,
    description: '',
    required: false,
    signatureRequired: true,
    allowedSignerTypes: [consentSignerTypeValues.client],
    active: true,
  }
}

function syncFromProps() {
  const source = props.template ?? {}
  Object.assign(local, emptyTemplate(), {
    name: source.name ?? '',
    consentType: source.consentType || consentTypeValues.treatment,
    description: source.description ?? '',
    required: Boolean(source.required),
    signatureRequired: source.signatureRequired !== false,
    allowedSignerTypes: Array.isArray(source.allowedSignerTypes)
      && source.allowedSignerTypes.length
      ? [...source.allowedSignerTypes]
      : [consentSignerTypeValues.client],
    active: source.active !== false,
  })
}

watch(
  () => [open.value, props.template, props.mode],
  ([isOpen]) => {
    if (isOpen) {
      syncFromProps()
    }
  },
)

function versionStatusLabel(status) {
  const key = consentVersionStatusI18nKey(status)

  return te(key) ? t(key) : status
}

function canEditVersion(version) {
  return props.canEditVersions && isConsentVersionEditable(version)
}

function canPublishVersion(version) {
  return props.canPublish
    && version?.status === consentVersionStatusValues.draft
    && !version?.presentedToClients
}

function canDeleteVersion(version) {
  return props.canDeleteVersions && isConsentVersionEditable(version)
}

function onCancel() {
  open.value = false
}

function onSave() {
  if (!canSave.value) {
    return
  }
  emit('save', { ...local })
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.consent-template-dialog__version-row {
  border: 1px solid $border-subtle;
  border-radius: 8px;
  background: $surface;
}
</style>
