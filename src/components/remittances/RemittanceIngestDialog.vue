<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog('remittance-ingest')"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('remittanceIngestTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body
        q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('remittanceIngestSubtitle') }}
        </p>
        <FormField
          :label="t('remittanceIngestPayload')"
          required>
          <q-input
            v-model="payload"
            type="textarea"
            outlined
            autogrow
            hide-bottom-space
            :data-testid="remittanceIngestTestIds.payload"
            :placeholder="t('remittanceIngestPlaceholder')"
          />
        </FormField>
        <FormToggle
          class="q-mt-md"
          v-model="autoPost"
          :label="t('remittanceIngestAutoPost')"
          :test-id="remittanceIngestTestIds.autoPost"
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
          :disable="submitting"
          :data-testid="modalTestIds.cancel('remittance-ingest')"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="submitting"
          :disable="submitting || !payload.trim()"
          :data-testid="modalTestIds.confirm('remittance-ingest')"
          :label="t('remittanceIngestConfirm')"
          @click="onConfirm"
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
import FormToggle from 'components/FormToggle.vue'
import { modalTestIds, remittanceIngestTestIds }
  from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t } = useI18n()
const payload = ref('')
const autoPost = ref(true)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

watch(() => props.modelValue, value => {
  if (value) {
    payload.value = ''
    autoPost.value = true
  }
})

function onCancel() {
  open.value = false
}

function onConfirm() {
  const raw = payload.value.trim()
  if (!raw) {
    return
  }
  let body = {
    ['raw_payload']: raw,
    ['auto_post']: autoPost.value,
  }
  if (raw.startsWith('{')) {
    try {
      body = {
        ...JSON.parse(raw),
        ['auto_post']: autoPost.value,
      }
    } catch {
      body = {
        ['raw_payload']: raw,
        ['auto_post']: autoPost.value,
      }
    }
  }
  emit('confirm', body)
}
</script>
