<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('allergyDeleteTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <p class="text-body1 q-mb-sm">
          {{ t('allergyDeleteMessage') }}
        </p>
        <p class="text-body2 text-weight-bold q-mb-md">
          {{ t('allergyDeleteMessageBold') }}
        </p>
        <p class="text-body2 q-mb-md">
          {{ t('allergyDeleteReasonHint') }}
        </p>
        <AddClientLabeledField :label="t('allergyDeleteReasonLabel')">
          <q-input
            v-model="reason"
            outlined
            type="textarea"
            rows="3"
            counter
            maxlength="500"
          />
        </AddClientLabeledField>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
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
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
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

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

watch(
  () => props.modelValue,
  visible => {
    if (visible) {
      reason.value = ''
    }
  },
)

function onCancel() {
  open.value = false
}

function onConfirm() {
  emit('confirm', String(reason.value ?? '').trim())
  open.value = false
}
</script>

