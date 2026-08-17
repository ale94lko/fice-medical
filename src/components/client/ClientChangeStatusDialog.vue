<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="clientListTestIds.changeStatusDialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('clientChangeStatusTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ statusChangeHint }}
        </p>

        <div
          v-if="currentStatusLabel"
          class="row items-center q-gutter-sm q-mb-md"
          :data-testid="clientListTestIds.changeStatusCurrent">
          <span class="text-body2 text-grey-7">
            {{ t('clientChangeStatusCurrent') }}
          </span>
          <AdminTableStatusCell
            :label="currentStatusLabel"
            :variant="currentStatusVariant"
          />
        </div>

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
            :disable="submitting"
            :placeholder="t('clientChangeStatusPlaceholder')"
            :error="Boolean(statusError)"
            :error-message="statusError"
            :test-id="clientListTestIds.changeStatusSelect">
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <AdminTableStatusCell
                    :label="scope.opt.label"
                    :variant="scope.opt.variant"
                  />
                </q-item-section>
              </q-item>
            </template>
          </FormSelect>
        </AddClientLabeledField>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :disable="submitting"
          :data-testid="clientListTestIds.changeStatusCancel"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="submitting"
          :disable="submitting || !canConfirm"
          :data-testid="clientListTestIds.changeStatusConfirm"
          :label="t('clientChangeStatusConfirm')"
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
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import FormSelect from 'components/FormSelect.vue'
import { clientStatusOptions } from 'src/utils/client-status.js'
import { clientListTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  selectedCount: {
    type: Number,
    default: 0,
  },
  clientName: {
    type: String,
    default: '',
  },
  currentStatusLabel: {
    type: String,
    default: '',
  },
  currentStatusVariant: {
    type: String,
    default: '',
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { t } = useI18n()

const selectedStatus = ref(null)
const statusError = ref('')

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const statusOptions = computed(() => clientStatusOptions(t))

const canConfirm = computed(() =>
  Boolean(String(selectedStatus.value ?? '').trim()),
)

const statusChangeHint = computed(() => {
  if (props.selectedCount > 1) {
    return t('clientChangeStatusMessageBulk', {
      count: props.selectedCount,
    })
  }
  const name = String(props.clientName ?? '').trim()
  if (name) {
    return t('clientChangeStatusMessageNamed', { name })
  }

  return t('clientChangeStatusMessage')
})

watch(
  () => props.modelValue,
  isOpen => {
    if (!isOpen) {
      return
    }
    selectedStatus.value = null
    statusError.value = ''
  },
)

watch(selectedStatus, () => {
  statusError.value = ''
})

function onCancel() {
  if (props.submitting) {
    return
  }
  open.value = false
}

function onConfirm() {
  if (!canConfirm.value) {
    statusError.value = t('clientChangeStatusRequired')
    return
  }
  statusError.value = ''
  emit('confirm', selectedStatus.value)
}
</script>
