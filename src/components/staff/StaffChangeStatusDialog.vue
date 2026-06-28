<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="staffListTestIds.changeStatusDialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('staffChangeStatusTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{
            t('staffChangeStatusMessage', {
              count: selectedCount,
            })
          }}
        </p>
        <AddClientLabeledField
          :label="t('status')"
          required>
          <FormSelect
            v-model="selectedStatus"
            outlined
            hide-bottom-space
            emit-value
            map-options
            :options="statusOptions"
            :placeholder="t('staffChangeStatusPlaceholder')"
            :error="Boolean(statusError)"
            :error-message="statusError"
          />
        </AddClientLabeledField>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
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
          :data-testid="staffListTestIds.changeStatusConfirm"
          :label="t('staffChangeStatusConfirm')"
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
import FormSelect from 'components/FormSelect.vue'
import { staffStatusOptions } from 'src/utils/staff-status.js'
import { staffListTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  selectedCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { t } = useI18n()

const selectedStatus = ref('')
const statusError = ref('')

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const statusOptions = computed(() => staffStatusOptions(t))

watch(
  () => props.modelValue,
  isOpen => {
    if (!isOpen) {
      return
    }
    selectedStatus.value = ''
    statusError.value = ''
  },
)

function onCancel() {
  open.value = false
}

function onConfirm() {
  if (!selectedStatus.value) {
    statusError.value = t('staffChangeStatusRequired')
    return
  }
  statusError.value = ''
  emit('confirm', selectedStatus.value)
  open.value = false
}
</script>
