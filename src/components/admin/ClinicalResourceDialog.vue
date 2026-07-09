<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog clinical-resource-dialog app-dialog-card"
      :data-testid="clinicalResourceDialogTestIds.dialog">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p
          v-if="dialogSubtitle"
          class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ dialogSubtitle }}
        </p>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('clinicalResourceTypeLabel')"
              required>
              <FormSelect
                v-model="local.type"
                outlined
                hide-bottom-space
                emit-value
                map-options
                class="full-width"
                :clearable="false"
                :readonly="readonly || isEditMode"
                :options="typeOptions"
                :placeholder="t('clinicalResourceTypePlaceholder')"
                :error="Boolean(errors.type)"
                :error-message="errors.type"
                :test-id="clinicalResourceDialogTestIds.field('type')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('clinicalResourceTitleLabel')"
              required>
              <TextInput
                v-model="local.title"
                :external-label="true"
                :readonly="readonly"
                :error="Boolean(errors.title)"
                :error-message="errors.title"
                :placeholder="t('clinicalResourceTitlePlaceholder')"
                :test-id="clinicalResourceDialogTestIds.field('title')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('clinicalResourceCategoryLabel')"
              required>
              <FormSelect
                v-model="local.category"
                outlined
                hide-bottom-space
                emit-value
                map-options
                class="full-width"
                :clearable="false"
                :readonly="readonly"
                :loading="categoriesLoading"
                :options="categoryOptions"
                :placeholder="t('clinicalResourceCategoryPlaceholder')"
                :error="Boolean(errors.category)"
                :error-message="errors.category"
                :test-id="clinicalResourceDialogTestIds.field('category')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('status')"
              required>
              <FormSelect
                v-model="local.status"
                outlined
                hide-bottom-space
                emit-value
                map-options
                class="full-width"
                :clearable="false"
                :readonly="readonly"
                :options="statusOptions"
                :placeholder="t('clinicalResourceStatusPlaceholder')"
                :test-id="clinicalResourceDialogTestIds.field('status')"
              />
            </AddClientLabeledField>
          </div>

          <div v-if="isExternalLink" class="col-12">
            <AddClientLabeledField
              :label="t('clinicalResourceUrlLabel')"
              required>
              <TextInput
                v-model="local.url"
                :external-label="true"
                :readonly="readonly"
                :error="Boolean(errors.url)"
                :error-message="errors.url"
                :placeholder="t('clinicalResourceUrlPlaceholder')"
                :test-id="clinicalResourceDialogTestIds.field('url')"
              />
            </AddClientLabeledField>
          </div>

          <div v-if="!isExternalLink" class="col-12">
            <ClinicalResourceKeywordsField
              v-model="local.keywords"
              :label="t('clinicalResourceKeywordsLabel')"
              :placeholder="t('clinicalResourceKeywordsPlaceholder')"
              :hint="t('clinicalResourceKeywordsHint')"
              :readonly="readonly"
              :test-id="clinicalResourceDialogTestIds.field('keywords')"
            />
          </div>

          <div v-if="!isExternalLink" class="col-12">
            <AddClientLabeledField
              :label="t('clinicalResourceContentLabel')"
              required>
              <TextInput
                v-model="local.content"
                type="textarea"
                :rows="3"
                :external-label="true"
                :readonly="readonly"
                :error="Boolean(errors.content)"
                :error-message="errors.content"
                :placeholder="t('clinicalResourceContentPlaceholder')"
                :test-id="clinicalResourceDialogTestIds.field('content')"
                class="clinical-resource-dialog__content-input"
              />
            </AddClientLabeledField>
          </div>

          <div v-if="!isExternalLink" class="col-12">
            <ClinicalResourceDocumentUploadField
              v-model="local.documentFile"
              :existing-file-name="local.documentFileName"
              :label="t('clinicalResourceDocumentLabel')"
              :readonly="readonly"
              :error="errors.documentFile"
              :test-id="clinicalResourceDialogTestIds.field('document')"
            />
          </div>

          <div v-if="isExternalLink" class="col-12">
            <ClinicalResourceKeywordsField
              v-model="local.keywords"
              :label="t('clinicalResourceKeywordsLabel')"
              :placeholder="t('clinicalResourceKeywordsPlaceholder')"
              :hint="t('clinicalResourceKeywordsHint')"
              :readonly="readonly"
              :test-id="clinicalResourceDialogTestIds.field('keywords')"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :disable="saving"
          :label="readonly ? t('close') : t('cancel')"
          :data-testid="clinicalResourceDialogTestIds.btn('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :disable="saving"
          :label="t('clinicalResourceSave')"
          :data-testid="clinicalResourceDialogTestIds.btn('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ClinicalResourceDocumentUploadField from
  'components/clinical/ClinicalResourceDocumentUploadField.vue'
import ClinicalResourceKeywordsField from
  'components/clinical/ClinicalResourceKeywordsField.vue'
import FormSelect from 'components/FormSelect.vue'
import TextInput from 'components/TextInput.vue'
import {
  clinicalResourceTypeValues,
  catalogNames,
} from 'components/constants.js'
import {
  buildClinicalResourceStatusOptions,
  buildClinicalResourceTypeOptions,
} from 'src/composables/useClinicalResourcePermissions.js'
import { fetchCatalogsByNames } from 'src/utils/catalogs.js'
import {
  buildResourceCategoryCatalogOptions,
  cloneClinicalResourceForm,
  createEmptyClinicalResourceForm,
} from 'src/utils/clinical-resource-form.js'
import { validateClinicalResourceForm } from
  'src/utils/clinical-resource-validation.js'
import { clinicalResourceDialogTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: {
    type: String,
    default: 'add',
    validator: value => ['add', 'edit', 'view'].includes(value),
  },
  resource: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const { t } = useI18n()

const local = ref(createEmptyClinicalResourceForm())
const errors = ref({})
const categoryOptions = ref([])
const categoriesLoading = ref(false)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')
const isEditMode = computed(() => props.mode === 'edit')
const isExternalLink = computed(
  () => local.value.type === clinicalResourceTypeValues.externalLink,
)
const typeOptions = computed(() => buildClinicalResourceTypeOptions(t))
const statusOptions = computed(() => buildClinicalResourceStatusOptions(t))

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('clinicalResourceViewTitle')
  }

  return props.mode === 'edit'
    ? t('clinicalResourceEditTitle')
    : t('clinicalResourceAddTitle')
})

const dialogSubtitle = computed(() => {
  if (props.mode === 'view') {
    return ''
  }

  return props.mode === 'edit'
    ? t('clinicalResourceEditSubtitle')
    : t('clinicalResourceAddSubtitle')
})

async function loadCategories() {
  categoriesLoading.value = true
  try {
    const catalogs = await fetchCatalogsByNames([
      catalogNames.resourceCategory,
    ])
    categoryOptions.value = buildResourceCategoryCatalogOptions(
      catalogs[catalogNames.resourceCategory],
    )
  } catch {
    categoryOptions.value = []
  } finally {
    categoriesLoading.value = false
  }
}

function syncLocalFromProps() {
  if (props.resource) {
    local.value = cloneClinicalResourceForm(props.resource)
  } else {
    local.value = createEmptyClinicalResourceForm()
  }
  errors.value = {}
}

function onCancel() {
  emit('cancel')
  open.value = false
}

function onSave() {
  errors.value = validateClinicalResourceForm(local.value, t, {
    isEdit: isEditMode.value,
  })
  if (Object.keys(errors.value).length) {
    return
  }
  emit('save', { ...local.value })
}

watch(
  () => [props.modelValue, props.resource, props.mode],
  () => {
    if (props.modelValue) {
      syncLocalFromProps()
      void loadCategories()
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.clinical-resource-dialog {
  &__content-input {
    :deep(textarea) {
      min-height: 72px;
      max-height: 72px;
      resize: vertical;
    }
  }
}
</style>
