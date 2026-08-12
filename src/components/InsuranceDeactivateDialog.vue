<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog('insurance-deactivate')"
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog insurance-dialog--confirm
        app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('insuranceDeactivateTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <p class="text-body1 q-mb-md">
          {{ t('insuranceDeactivateMessage') }}
        </p>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <AddClientLabeledField
              required
              :label="t('insuranceDeactivationReasonLabel')">
              <FormSelect
                v-model="reasonCode"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :options="reasonOptions"
                :loading="catalogLoading"
                :placeholder="t('insuranceDeactivationReasonPlaceholder')"
                :error="Boolean(reasonError)"
                :error-message="reasonError"
                :test-id="tid.insuranceField('deactivation-reason')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :required="notesRequired"
              :label="notesRequired
                ? t('insuranceDeactivationNotesRequiredLabel')
                : t('insuranceDeactivationNotesLabel')">
              <q-input
                v-model="notes"
                outlined
                type="textarea"
                rows="3"
                counter
                maxlength="500"
                :placeholder="t('insuranceDeactivationNotesPlaceholder')"
                :error="Boolean(notesError)"
                :error-message="notesError"
                :data-testid="tid.insuranceField('deactivation-notes')"
              />
            </AddClientLabeledField>
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
          :disable="submitting"
          :data-testid="modalTestIds.cancel('insurance-deactivate')"
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
          :data-testid="modalTestIds.confirm('insurance-deactivate')"
          :label="t('insuranceDeactivateConfirm')"
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
import {
  catalogNames,
  insuranceDeactivationReasonOtherCode,
} from 'components/constants.js'
import { addClientTestIds as tid, modalTestIds } from
  'src/test-ids/index.js'
import {
  catalogItemsFromCatalog,
  fetchCatalogsByNames,
  mapCatalogItemsToSelectOptions,
} from 'src/utils/catalogs.js'

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

const reasonCode = ref(null)
const notes = ref('')
const reasonError = ref('')
const notesError = ref('')
const catalogLoading = ref(false)
const reasonOptions = ref([])

const notesRequired = computed(
  () => reasonCode.value === insuranceDeactivationReasonOtherCode,
)

const canConfirm = computed(() => {
  if (!String(reasonCode.value ?? '').trim()) {
    return false
  }
  if (notesRequired.value && !String(notes.value ?? '').trim()) {
    return false
  }

  return true
})

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

watch(
  () => props.modelValue,
  async visible => {
    if (!visible) {
      return
    }
    reasonCode.value = null
    notes.value = ''
    reasonError.value = ''
    notesError.value = ''
    await loadReasonCatalog()
  },
)

watch(reasonCode, () => {
  reasonError.value = ''
  if (!notesRequired.value) {
    notesError.value = ''
  }
})

async function loadReasonCatalog() {
  catalogLoading.value = true
  try {
    const catalogs = await fetchCatalogsByNames([
      catalogNames.insuranceDeactivationReason,
    ])
    const catalog = catalogs?.[catalogNames.insuranceDeactivationReason]
    reasonOptions.value = mapCatalogItemsToSelectOptions(
      catalogItemsFromCatalog(catalog),
    )
  } catch {
    reasonOptions.value = []
  } finally {
    catalogLoading.value = false
  }
}

function onCancel() {
  if (props.submitting) {
    return
  }
  open.value = false
}

function onConfirm() {
  reasonError.value = ''
  notesError.value = ''
  const reason = String(reasonCode.value ?? '').trim()
  if (!reason) {
    reasonError.value = t('insuranceDeactivationReasonRequired')

    return
  }
  const notesText = String(notes.value ?? '').trim()
  if (notesRequired.value && !notesText) {
    notesError.value = t('insuranceDeactivationNotesRequired')

    return
  }
  emit('confirm', {
    reason,
    notes: notesText || null,
  })
}
</script>
