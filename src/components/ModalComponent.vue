<template>
  <q-dialog
    v-model="modelValue"
    :data-testid="dialogTestId"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="modal-card app-dialog-card">
      <AppDialogHeader
        :close-label="closeLabel"
        @close="onCancel">
        {{ title }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-xl q-py-md modal-body
          flex flex-center">
        <div class="text-body1">{{ message }}</div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          padding="7px 30px"
          v-if="cancelText"
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="cancelTestId"
          :title="cancelText"
          :label="cancelText"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          class="primary-action"
          color="primary"
          :data-testid="confirmTestId"
          :title="confirmText"
          :label="confirmText"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import { modalTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const closeLabel = computed(() => t('close'))

const props = defineProps({
  modelValue: Boolean, // v-model
  title: { type: String, default: 'Confirm' },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'OK' },
  cancelText: { type: String, default: 'Cancel' },
  testId: { type: String, default: 'default' },
  confirmButtonTestId: { type: String, default: '' },
  cancelButtonTestId: { type: String, default: '' },
})

const dialogTestId = computed(() => modalTestIds.dialog(props.testId))
const confirmTestId = computed(() =>
  props.confirmButtonTestId || modalTestIds.confirm(props.testId),
)
const cancelTestId = computed(() =>
  props.cancelButtonTestId || modalTestIds.cancel(props.testId),
)

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const modelValue = toRef(props, 'modelValue')

const onConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const onCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
  .primary-action {
    padding: 7px 30px;
  }
</style>
