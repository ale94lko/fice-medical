<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(testIdName)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('claimRouteTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body
        q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('claimRouteHint') }}
        </p>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <FormField
              required
              :label="t('claimRouteElectronicPayerId')">
              <TextInput
                v-model="form.electronicPayerId"
                :external-label="true"
                :test-id="modalTestIds.dialog(
                  `${testIdName}-payer-id`,
                )"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField :label="t('claimRouteClearinghouse')">
              <TextInput
                v-model="form.clearinghouseName"
                :external-label="true"
                :test-id="modalTestIds.dialog(
                  `${testIdName}-clearinghouse`,
                )"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField required :label="t('claimRouteSubmitterId')">
              <TextInput
                v-model="form.submitterId"
                :external-label="true"
                :test-id="modalTestIds.dialog(
                  `${testIdName}-submitter-id`,
                )"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField
              required
              :label="t('claimRouteSubmitterName')">
              <TextInput
                v-model="form.submitterName"
                :external-label="true"
                :test-id="modalTestIds.dialog(
                  `${testIdName}-submitter-name`,
                )"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField required :label="t('claimRouteReceiverId')">
              <TextInput
                v-model="form.receiverId"
                :external-label="true"
                :test-id="modalTestIds.dialog(
                  `${testIdName}-receiver-id`,
                )"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField
              required
              :label="t('claimRouteReceiverName')">
              <TextInput
                v-model="form.receiverName"
                :external-label="true"
                :test-id="modalTestIds.dialog(
                  `${testIdName}-receiver-name`,
                )"
              />
            </FormField>
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
          :data-testid="modalTestIds.cancel(testIdName)"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="submitting"
          :disable="submitting"
          :data-testid="modalTestIds.confirm(testIdName)"
          :label="t('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormField from 'components/FormField.vue'
import TextInput from 'components/TextInput.vue'
import { modalTestIds } from 'src/test-ids/index.js'
import {
  claimApiErrorMessage,
  fetchClaimSubmissionRoute,
  updateClaimSubmissionRoute,
} from 'src/utils/claim-api.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'saved', 'error'])
const { t } = useI18n()
const testIdName = 'claim-route'
const submitting = ref(false)
const form = reactive(emptyForm())
let version = null

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

watch(() => props.modelValue, async(openNow) => {
  if (!openNow) {
    return
  }
  try {
    const route = await fetchClaimSubmissionRoute()
    form.electronicPayerId = String(
      route.electronic_payer_id ?? '',
    )
    form.clearinghouseName = String(
      route.clearinghouse_name ?? '',
    )
    form.submitterId = String(route.submitter_id ?? '')
    form.submitterName = String(route.submitter_name ?? '')
    form.receiverId = String(route.receiver_id ?? '')
    form.receiverName = String(route.receiver_name ?? '')
    version = route.version ?? null
  } catch (error) {
    emit('error', claimApiErrorMessage(
      error,
      t('claimRouteLoadError'),
    ))
  }
})

function emptyForm() {
  return {
    electronicPayerId: '',
    clearinghouseName: '',
    submitterId: '',
    submitterName: '',
    receiverId: '',
    receiverName: '',
  }
}

function onCancel() {
  if (submitting.value) {
    return
  }
  open.value = false
}

async function onSave() {
  submitting.value = true
  try {
    await updateClaimSubmissionRoute({
      'electronic_payer_id': form.electronicPayerId,
      'clearinghouse_name': form.clearinghouseName,
      'submitter_id': form.submitterId,
      'submitter_name': form.submitterName,
      'receiver_id': form.receiverId,
      'receiver_name': form.receiverName,
      version,
    })
    open.value = false
    emit('saved')
  } catch (error) {
    emit('error', claimApiErrorMessage(
      error,
      t('claimRouteSaveError'),
    ))
  } finally {
    submitting.value = false
  }
}
</script>
