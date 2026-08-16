<template>
  <div
    class="add-client-consents-tab"
    :data-testid="tid.root">
    <div
      v-if="!canView"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('clientConsentsNoPermission') }}
      </p>
    </div>

    <template v-else-if="!hasClientId">
      <div class="fmh-list-card q-pa-lg text-center">
        <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
        <p class="text-body1 text-grey-8 q-mb-none">
          {{ t('labSaveClientFirst') }}
        </p>
      </div>
    </template>

    <template v-else>
      <div class="consents-header row items-start">
        <div class="col">
          <h2 class="consents-title">
            {{ t('clientConsentsTitle') }}
          </h2>
          <p class="consents-subtitle text-body2">
            {{ t('clientConsentsSubtitle') }}
          </p>
        </div>
        <div
          v-if="canAssign"
          class="col-auto">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="assignment_add"
            :disable="loading || assigning"
            :data-testid="tid.btnAssign"
            :label="t('clientConsentAssign')"
            @click="assignOpen = true"
          />
        </div>
      </div>

      <div
        v-if="loading"
        class="fmh-list-card q-pa-xl flex flex-center q-mt-md">
        <AppBrandLoading inline />
      </div>

      <AdminTablePanel
        v-else
        class="consents-table-panel admin-table-panel--wide q-mt-md"
        :show-column-settings="false">
        <ClientConsentsTable
          :rows="rows"
          :loading="false"
          :can-sign="canSign"
          :can-edit="canEdit"
          :can-download="canDownload"
          :can-revoke="canRevoke"
          :empty-label="t('clientConsentsEmpty')"
          @view="onView"
          @sign="onSign"
          @decline="onDecline"
          @cancel="onCancelConsent"
          @print="onPrint"
          @download="onDownload"
          @revoke="onRevokeRequest"
        />
      </AdminTablePanel>
    </template>

    <ClientConsentAssignDialog
      v-model="assignOpen"
      :saving="assigning"
      @submit="onAssignSubmit"
    />
    <ClientConsentViewDialog
      v-model="viewOpen"
      :consent="activeConsent"
    />
    <ClientConsentSignDialog
      v-model="signOpen"
      :consent="activeConsent"
      :client-id="clientId"
      :client-display-name="clientDisplayName"
      :contact-section="contactSection"
      :can-send-secure-link="canAssign"
      :saving="signing"
      @submit="onSignSubmit"
      @secure-link-sent="onSecureLinkSent"
    />
    <ClientConsentRevokeDialog
      v-model="revokeOpen"
      :saving="revoking"
      @confirm="onRevokeConfirm"
    />
    <ModalComponent
      v-model="confirmOpen"
      :test-id="confirmTestId"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmLabel"
      :cancel-text="t('cancel')"
      @confirm="onConfirmAction"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AppBrandLoading from 'components/AppBrandLoading.vue'
import ClientConsentAssignDialog from
  'components/ClientConsentAssignDialog.vue'
import ClientConsentRevokeDialog from
  'components/ClientConsentRevokeDialog.vue'
import ClientConsentSignDialog from
  'components/ClientConsentSignDialog.vue'
import ClientConsentViewDialog from
  'components/ClientConsentViewDialog.vue'
import ClientConsentsTable from 'components/ClientConsentsTable.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  consentSignatureMethodValues,
  quasarNotifyTypes,
  storedFileCategories,
} from 'components/constants.js'
import { useConsentPermissions } from
  'src/composables/useConsentPermissions.js'
import { clientConsentsTestIds as tid } from 'src/test-ids/index.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { hasClientChartKey } from 'components/helpers.js'
import {
  assignClientConsent,
  cancelClientConsent,
  consentApiErrorMessage,
  declineClientConsent,
  downloadClientConsentDocument,
  fetchClientConsent,
  listClientConsents,
  printClientConsentDocument,
  revokeClientConsent,
  signClientConsent,
} from 'src/utils/consent-api.js'
import {
  triggerBlobDownload,
  uploadStoredFile,
} from 'src/utils/stored-file-api.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  clientDisplayName: {
    type: String,
    default: '',
  },
  contactSection: {
    type: Object,
    default: null,
  },
  canView: {
    type: Boolean,
    default: true,
  },
})

const { t } = useI18n()
const $q = useQuasar()
const {
  canAssign,
  canSign,
  canRevoke,
  canDownload,
  canEdit,
} = useConsentPermissions()

const loading = ref(false)
const rows = ref([])
const assignOpen = ref(false)
const assigning = ref(false)
const viewOpen = ref(false)
const signOpen = ref(false)
const signing = ref(false)
const revokeOpen = ref(false)
const revoking = ref(false)
const activeConsent = ref(null)
const confirmOpen = ref(false)
const confirmAction = ref(null)

const hasClientId = computed(() =>
  hasClientChartKey(props.clientId),
)

const confirmTitle = computed(() => {
  if (confirmAction.value?.type === 'decline') {
    return t('clientConsentDeclineTitle')
  }
  if (confirmAction.value?.type === 'cancel') {
    return t('clientConsentCancelTitle')
  }

  return t('confirm')
})

const confirmMessage = computed(() => {
  if (confirmAction.value?.type === 'decline') {
    return t('clientConsentDeclineMessage')
  }
  if (confirmAction.value?.type === 'cancel') {
    return t('clientConsentCancelMessage')
  }

  return ''
})

const confirmLabel = computed(() => {
  if (confirmAction.value?.type === 'decline') {
    return t('clientConsentDecline')
  }
  if (confirmAction.value?.type === 'cancel') {
    return t('clientConsentCancel')
  }

  return t('confirm')
})

const confirmTestId = computed(() => {
  if (confirmAction.value?.type === 'decline') {
    return 'client-consent-decline'
  }
  if (confirmAction.value?.type === 'cancel') {
    return 'client-consent-cancel'
  }

  return 'client-consent-confirm'
})

function notifyError(error, fallbackKey) {
  if (isAuthSessionEndUIError(error)) {
    return
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: consentApiErrorMessage(error, t(fallbackKey)),
  })
}

async function loadConsents() {
  if (!props.canView || !hasClientId.value) {
    rows.value = []

    return
  }
  loading.value = true
  try {
    rows.value = await listClientConsents(props.clientId)
  } catch (error) {
    notifyError(error, 'clientConsentsLoadError')
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function onView(item) {
  try {
    activeConsent.value = await fetchClientConsent(props.clientId, item.id)
    viewOpen.value = true
  } catch (error) {
    notifyError(error, 'clientConsentLoadError')
  }
}

async function onSign(item) {
  try {
    activeConsent.value = await fetchClientConsent(props.clientId, item.id)
    signOpen.value = true
  } catch (error) {
    notifyError(error, 'clientConsentLoadError')
  }
}

function onDecline(item) {
  confirmAction.value = { type: 'decline', item }
  confirmOpen.value = true
}

function onCancelConsent(item) {
  confirmAction.value = { type: 'cancel', item }
  confirmOpen.value = true
}

function onRevokeRequest(item) {
  activeConsent.value = item
  revokeOpen.value = true
}

async function onConfirmAction() {
  const action = confirmAction.value
  confirmOpen.value = false
  confirmAction.value = null
  if (!action?.item?.id) {
    return
  }
  try {
    if (action.type === 'decline') {
      await declineClientConsent(props.clientId, action.item.id)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('clientConsentDeclineSuccess'),
      })
    } else if (action.type === 'cancel') {
      await cancelClientConsent(props.clientId, action.item.id)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('clientConsentCancelSuccess'),
      })
    }
    await loadConsents()
  } catch (error) {
    notifyError(error, 'clientConsentActionError')
  }
}

async function onAssignSubmit(payload) {
  assigning.value = true
  try {
    await assignClientConsent(props.clientId, payload)
    assignOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clientConsentAssignSuccess'),
    })
    await loadConsents()
  } catch (error) {
    notifyError(error, 'clientConsentAssignError')
  } finally {
    assigning.value = false
  }
}

async function onSignSubmit(payload) {
  if (!activeConsent.value?.id) {
    return
  }
  signing.value = true
  try {
    let signPayload = { ...payload }
    if (
      payload.signatureMethod
        === consentSignatureMethodValues.inPersonPaper
      && payload.paperFile
    ) {
      const uploaded = await uploadStoredFile(
        payload.paperFile,
        storedFileCategories.consentForm,
        { clientId: props.clientId },
      )
      signPayload = {
        signerName: payload.signerName,
        signerType: payload.signerType,
        relationshipToClient: payload.relationshipToClient,
        signatureMethod: consentSignatureMethodValues.inPersonPaper,
        signatureFileId: uploaded.id,
      }
    }
    await signClientConsent(
      props.clientId,
      activeConsent.value.id,
      signPayload,
    )
    signOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clientConsentSignSuccess'),
    })
    await loadConsents()
  } catch (error) {
    notifyError(error, 'clientConsentSignError')
  } finally {
    signing.value = false
  }
}

async function onSecureLinkSent() {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('clientConsentSecureLinkSuccess'),
  })
  await loadConsents()
}

async function onRevokeConfirm(reason) {
  if (!activeConsent.value?.id) {
    return
  }
  revoking.value = true
  try {
    await revokeClientConsent(
      props.clientId,
      activeConsent.value.id,
      reason,
    )
    revokeOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clientConsentRevokeSuccess'),
    })
    await loadConsents()
  } catch (error) {
    notifyError(error, 'clientConsentRevokeError')
  } finally {
    revoking.value = false
  }
}

async function onDownload(item) {
  try {
    const { blob, fileName } = await downloadClientConsentDocument(
      props.clientId,
      item.id,
      { version: item.version },
    )
    triggerBlobDownload(blob, fileName)
  } catch (error) {
    notifyError(error, 'clientConsentDownloadError')
  }
}

async function onPrint(item) {
  let dismissPrinting = null
  try {
    dismissPrinting = $q.notify({
      timeout: 0,
      spinner: true,
      position: 'top',
      color: 'primary',
      message: t('clientConsentPrinting'),
    })
    const { blob, fileName } = await printClientConsentDocument(
      props.clientId,
      item.id,
      { version: item.version },
    )
    triggerBlobDownload(blob, fileName)
  } catch (error) {
    notifyError(error, 'clientConsentPrintError')
  } finally {
    if (typeof dismissPrinting === 'function') {
      dismissPrinting()
    }
  }
}

watch(
  () => [props.clientId, props.canView],
  () => {
    void loadConsents()
  },
)

onMounted(() => {
  void loadConsents()
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.consents-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: $text-strong;
}

.consents-subtitle {
  margin: 4px 0 0;
  color: $text-muted;
}
</style>
