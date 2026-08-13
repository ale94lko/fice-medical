<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('encounterRequirementWaiveTitle') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('encounterRequirementWaiveHint', {
            name: requirementLabel,
          }) }}
        </p>
        <FormField :label="t('encounterRequirementWaiveReason')" required>
          <q-input
            v-model="reason"
            type="textarea"
            outlined
            autogrow
            data-testid="encounter-waive-reason"
          />
        </FormField>
      </q-card-section>
      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="!canSubmit"
          :loading="saving"
          :label="t('encounterRequirementWaiveConfirm')"
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

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  requirement: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t } = useI18n()
const reason = ref('')

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const requirementLabel = computed(() =>
  String(props.requirement?.label || props.requirement?.code || '')
    .trim() || '—',
)

const canSubmit = computed(() => Boolean(String(reason.value).trim()))

watch(() => props.modelValue, (visible) => {
  if (visible) {
    reason.value = ''
  }
})

function onCancel() {
  open.value = false
}

function onConfirm() {
  if (!canSubmit.value) {
    return
  }
  emit('confirm', { reason: String(reason.value).trim() })
}
</script>
