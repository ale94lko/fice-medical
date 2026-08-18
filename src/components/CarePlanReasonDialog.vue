<template>
  <q-dialog
    v-model="open"
    persistent
    class="app-nested-dialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog insurance-dialog--confirm
        app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ title }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <p
          v-if="message"
          class="text-body1 q-mb-md">
          {{ message }}
        </p>
        <p
          v-if="hint"
          class="text-body2 q-mb-md">
          {{ hint }}
        </p>
        <AddClientLabeledField
          required
          :label="reasonLabel">
          <q-input
            v-model="reason"
            outlined
            type="textarea"
            rows="3"
            counter
            maxlength="500"
            :data-testid="tid.field(reasonField)"
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
          :data-testid="tid.btn('reason-cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="!hasReason"
          :label="confirmLabel"
          :data-testid="tid.btn('reason-confirm')"
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
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  reasonLabel: {
    type: String,
    default: '',
  },
  confirmLabel: {
    type: String,
    default: '',
  },
  reasonField: {
    type: String,
    default: 'reason',
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { t } = useI18n()
const reason = ref('')

const hasReason = computed(
  () => String(reason.value ?? '').trim().length > 0,
)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
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
  if (!hasReason.value) {
    return
  }
  emit('confirm', String(reason.value ?? '').trim())
  open.value = false
}
</script>
