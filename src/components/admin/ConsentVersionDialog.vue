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
          :label="t('cancel')"
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

    <ConsentContentPreviewDialog
      v-model="previewOpen"
      :content-html="local.contentHtml"
    />
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormField from 'components/FormField.vue'
import TextInput from 'components/TextInput.vue'
import ConsentContentPreviewDialog from
  'components/admin/ConsentContentPreviewDialog.vue'
import {
  consentVersionDialogTestIds as tid,
  modalTestIds,
} from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'add' },
  version: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const previewOpen = ref(false)
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

  return true
})

function emptyVersion() {
  return {
    version: '',
    effectiveDate: '',
    expirationDate: '',
    contentHtml: '',
  }
}

function syncFromProps() {
  const source = props.version ?? {}
  Object.assign(local, emptyVersion(), {
    version: source.version ?? '',
    effectiveDate: source.effectiveDate ?? '',
    expirationDate: source.expirationDate ?? '',
    contentHtml: source.contentHtml ?? '',
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

function onSave() {
  if (!canSave.value) {
    return
  }
  emit('save', { ...local })
}
</script>
