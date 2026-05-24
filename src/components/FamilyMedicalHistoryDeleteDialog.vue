<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog">
      <q-toolbar class="q-px-md app-dialog-toolbar">
        <q-toolbar-title>{{ t('fmhDeleteTitle') }}</q-toolbar-title>
      </q-toolbar>
      <q-card-section class="q-px-lg q-pt-md q-pb-sm">
        <p class="text-body1 q-mb-md">
          {{ t('fmhDeleteMessage') }}
        </p>
        <q-input
          v-model="reason"
          outlined
          type="textarea"
          rows="3"
          :label="t('fmhDeleteReasonLabel')"
          :error="Boolean(reasonError)"
          :error-message="reasonError"
          maxlength="500"
        />
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('confirm')"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { t } = useI18n()

const reason = ref('')
const reasonError = ref('')

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

watch(
  () => props.modelValue,
  visible => {
    if (visible) {
      reason.value = ''
      reasonError.value = ''
    }
  },
)

function onCancel() {
  open.value = false
}

function onConfirm() {
  const s = String(reason.value ?? '').trim()
  if (!s) {
    reasonError.value = t('fmhDeleteReasonRequired')

    return
  }
  emit('confirm', s)
  open.value = false
}
</script>

<style lang="scss" scoped>
.family-medical-history-dialog {
  min-width: 440px;
  max-width: 560px;
  width: 100%;
}
</style>
