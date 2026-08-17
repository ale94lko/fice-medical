<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(tid.assignDialog)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('clientConsentAssignTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clientConsentAssignHint') }}
        </p>
        <FormField required :label="t('consentTemplateName')">
          <FormSelect
            v-model="templateId"
            outlined
            dense
            emit-value
            map-options
            :options="templateOptions"
            :loading="loadingTemplates"
          />
        </FormField>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="tid.assignCancel"
          :label="t('cancel')"
          :disable="saving"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="tid.assignSubmit"
          :label="t('clientConsentAssignSubmit')"
          :loading="saving"
          :disable="!templateId"
          @click="onSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import { clientConsentsTestIds as tid, modalTestIds } from
  'src/test-ids/index.js'
import { listConsentTemplates } from 'src/utils/consent-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'submit'])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const loadingTemplates = ref(false)
const templates = ref([])
const templateId = ref(null)

const templateOptions = computed(() =>
  templates.value
    .filter(item => item.active !== false)
    .map(item => ({
      label: item.name,
      value: item.id,
    })),
)

async function loadTemplates() {
  loadingTemplates.value = true
  try {
    templates.value = await listConsentTemplates({ active: true })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      templates.value = []
    }
  } finally {
    loadingTemplates.value = false
  }
}

watch(open, value => {
  if (!value) {
    return
  }
  templateId.value = null
  void loadTemplates()
})

function onCancel() {
  open.value = false
}

function onSubmit() {
  if (!templateId.value) {
    return
  }
  emit('submit', { consentTemplateId: templateId.value })
}
</script>
