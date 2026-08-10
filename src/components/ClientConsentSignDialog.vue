<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(tid.signDialog)"
    transition-show="scale"
    transition-hide="scale">
    <q-card
      :class="cardClass">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        v-if="step === 'method'"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clientConsentSignMethodHint') }}
        </p>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <FormField required :label="t('clientConsentSignerType')">
              <FormSelect
                v-model="signerType"
                outlined
                dense
                emit-value
                map-options
                :options="signerOptions"
              />
            </FormField>
          </div>
          <div class="col-12 col-sm-6">
            <FormField
              required
              :label="t('clientConsentSignatureMethod')">
              <FormSelect
                v-model="signatureMethod"
                outlined
                dense
                emit-value
                map-options
                :options="methodOptions"
              />
            </FormField>
          </div>
          <div
            v-if="isSecureLink && !secureLinkBlocked"
            class="col-12">
            <FormField :label="t('clientConsentSecureLinkEmail')">
              <TextInput
                v-model="secureLinkEmail"
                outlined
                dense
                hide-bottom-space
                type="email"
                :placeholder="t('emailAddressPlaceholder')"
              />
            </FormField>
          </div>
        </div>
        <p
          v-if="methodUnavailable"
          class="text-body2 text-negative q-mt-md q-mb-none">
          {{ t('clientConsentSignMethodUnavailable') }}
        </p>
        <p
          v-else-if="secureLinkBlocked"
          class="text-body2 text-negative q-mt-md q-mb-none">
          {{ t('clientConsentSecureLinkNoPermission') }}
        </p>
        <p
          v-else-if="guardianContactMissing"
          class="text-body2 text-negative q-mt-md q-mb-none">
          {{ t('clientConsentGuardianContactRequired') }}
        </p>
      </q-card-section>

      <q-card-section
        v-else-if="step === 'in_person'"
        class="client-consent-sign-dialog__body">
        <div
          class="client-consent-sign-dialog__content"
          v-html="consent?.contentHtml || ''"
        />
        <div class="client-consent-sign-dialog__form">
          <div class="row q-col-gutter-md">
            <div
              class="col-12"
              :class="isInPersonPaper ? 'col-sm' : 'col-sm-6'">
              <FormField required :label="t('clientConsentSignerName')">
                <TextInput
                  v-model="signerName"
                  outlined
                  dense
                  hide-bottom-space
                  :maxlength="consentSignerNameMaxLength"
                />
              </FormField>
            </div>
            <div
              v-if="needsRelationship"
              class="col-12"
              :class="isInPersonPaper ? 'col-sm' : 'col-sm-6'">
              <FormField
                required
                :label="t('clientConsentRelationship')">
                <TextInput
                  v-model="relationshipToClient"
                  outlined
                  dense
                  hide-bottom-space
                  :maxlength="consentRelationshipMaxLength"
                />
              </FormField>
            </div>
            <div
              v-if="isInPersonPaper"
              class="col-12 col-sm-auto
                client-consent-sign-dialog__print-col">
              <q-btn
                no-caps
                outline
                color="primary"
                class="app-btn-outline"
                icon="print"
                :label="t('clientConsentPrint')"
                :loading="printing"
                :disable="busy || !canPrintPaper"
                :data-testid="tid.btnPrintPaper"
                @click="onPrintPaper"
              />
            </div>
            <div
              v-if="isInPersonDigital"
              class="col-12">
              <SignatureCanvas
                v-model="signatureArtifact"
                size="tall"
                :hint="t('clientConsentSignatureHint')"
              />
            </div>
            <div
              v-else-if="isInPersonPaper"
              class="col-12">
              <FormField
                required
                :label="t('clientConsentPaperScan')">
                <ConsentPaperScanUploadField
                  v-model="paperFile"
                  :test-id="tid.paperScanUpload"
                />
              </FormField>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-section
        v-else
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-positive q-mb-md">
          {{ t('clientConsentSecureLinkSuccess') }}
        </p>
        <p
          v-if="secureLinkResult?.emailSentTo"
          class="text-body2 text-grey-7 q-mb-sm">
          {{ t('clientConsentSecureLinkSentTo', {
            email: secureLinkResult.emailSentTo,
          }) }}
        </p>
        <p
          v-if="secureLinkResult?.expiresAt"
          class="text-body2 text-grey-7 q-mb-md">
          {{ t('clientConsentSecureLinkExpires', {
            date: formatConsentDateTime(secureLinkResult.expiresAt),
          }) }}
        </p>
        <FormField :label="t('clientConsentSecureLinkUrl')">
          <TextInput
            :model-value="secureLinkResult?.secureLinkUrl || ''"
            outlined
            dense
            hide-bottom-space
            readonly
          />
        </FormField>
      </q-card-section>

      <q-card-actions
        align="right"
        class="app-dialog-card__actions"
        :class="{
          'client-consent-sign-dialog__actions': step === 'in_person',
        }">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="secondaryLabel"
          :disable="busy"
          @click="onSecondary"
        />
        <q-btn
          v-if="step === 'method'"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="methodPrimaryLabel"
          :loading="isSecureLink && sendingLink"
          :disable="!canGoNext || busy"
          @click="onMethodPrimary"
        />
        <q-btn
          v-else-if="step === 'in_person'"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('clientConsentSignConfirm')"
          :loading="saving"
          :disable="!canSubmitInPerson"
          @click="onConfirmInPerson"
        />
        <q-btn
          v-else
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('copy')"
          :disable="!secureLinkResult?.secureLinkUrl"
          @click="onCopyLink"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { copyToClipboard, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ConsentPaperScanUploadField from
  'components/ConsentPaperScanUploadField.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import SignatureCanvas from 'components/SignatureCanvas.vue'
import TextInput from 'components/TextInput.vue'
import {
  consentRelationshipMaxLength,
  consentSignatureMethodValues,
  consentSignerNameMaxLength,
  consentSignerTypeValues,
  quasarNotifyTypes,
} from 'components/constants.js'
import { clientConsentsTestIds as tid, modalTestIds } from
  'src/test-ids/index.js'
import {
  consentApiErrorMessage,
  printClientConsentDocument,
  sendClientConsentSecureLink,
} from 'src/utils/consent-api.js'
import {
  buildConsentSignatureMethodOptions,
  buildConsentSignerTypeOptions,
  formatConsentDateTime,
} from 'src/utils/consent-i18n.js'
import { resolveConsentSecureLinkEmail } from
  'src/utils/consent-secure-link-email.js'
import { resolveGuardianSignerFromContact } from
  'src/utils/consent-signer-contact.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { triggerBlobDownload } from 'src/utils/stored-file-api.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  consent: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  clientId: { type: [String, Number], default: null },
  clientDisplayName: { type: String, default: '' },
  contactSection: { type: Object, default: null },
  canSendSecureLink: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'submit', 'secure-link-sent'])
const { t, te } = useI18n()
const $q = useQuasar()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const step = ref('method')
const signerName = ref('')
const signerType = ref(consentSignerTypeValues.client)
const signatureMethod = ref(consentSignatureMethodValues.inPersonDigital)
const relationshipToClient = ref('')
const signatureArtifact = ref('')
const paperFile = ref(null)
const printing = ref(false)
const secureLinkEmail = ref('')
const sendingLink = ref(false)
const secureLinkResult = ref(null)

const allowedSignerTypes = computed(() => {
  const list = props.consent?.allowedSignerTypes

  return Array.isArray(list) ? list : []
})

const signerOptions = computed(() => buildConsentSignerTypeOptions(
  t,
  te,
  allowedSignerTypes.value,
))

const methodOptions = computed(
  () => buildConsentSignatureMethodOptions(t, te),
)

const needsRelationship = computed(
  () => signerType.value !== consentSignerTypeValues.client,
)

const isGuardianSigner = computed(
  () => signerType.value === consentSignerTypeValues.guardian,
)

const guardianSignerDefaults = computed(() => {
  if (!isGuardianSigner.value) {
    return null
  }

  return resolveGuardianSignerFromContact(props.contactSection)
})

const guardianContactMissing = computed(
  () => isGuardianSigner.value && !guardianSignerDefaults.value,
)

const isInPersonDigital = computed(
  () => signatureMethod.value
    === consentSignatureMethodValues.inPersonDigital,
)

const isInPersonPaper = computed(
  () => signatureMethod.value
    === consentSignatureMethodValues.inPersonPaper,
)

const isInPersonSign = computed(
  () => isInPersonDigital.value || isInPersonPaper.value,
)

const isSecureLink = computed(
  () => signatureMethod.value === consentSignatureMethodValues.secureLink,
)

const methodUnavailable = computed(
  () => !isInPersonSign.value && !isSecureLink.value,
)

const secureLinkBlocked = computed(
  () => isSecureLink.value && !props.canSendSecureLink,
)

const canGoNext = computed(() => {
  if (!signerType.value) {
    return false
  }
  if (guardianContactMissing.value) {
    return false
  }
  if (isInPersonSign.value) {
    return true
  }
  if (isSecureLink.value) {
    return props.canSendSecureLink
  }

  return false
})

const canSubmitInPerson = computed(() => {
  if (!String(signerName.value ?? '').trim()) {
    return false
  }
  if (needsRelationship.value
    && !String(relationshipToClient.value ?? '').trim()) {
    return false
  }
  if (isInPersonPaper.value) {
    return Boolean(paperFile.value)
  }
  if (!String(signatureArtifact.value ?? '').trim()) {
    return false
  }

  return true
})

const canPrintPaper = computed(() => {
  const clientId = Number(props.clientId)
  const consentId = Number(props.consent?.id)

  return Number.isFinite(clientId)
    && clientId > 0
    && Number.isFinite(consentId)
    && consentId > 0
})

const busy = computed(
  () => props.saving || sendingLink.value || printing.value,
)

const methodPrimaryLabel = computed(() => {
  if (isSecureLink.value) {
    return t('clientConsentSecureLinkSend')
  }

  return t('next')
})

const dialogTitle = computed(() => {
  const name = props.consent?.consentName || t('clientConsentSignTitle')
  if (step.value === 'secure_link_result') {
    return t('clientConsentSecureLinkTitle')
  }
  if (step.value === 'method') {
    return t('clientConsentSignMethodTitle')
  }

  return name
})

const secondaryLabel = computed(() => {
  if (step.value === 'method' || step.value === 'secure_link_result') {
    return t('cancel')
  }

  return t('previous')
})

const cardClass = computed(() => {
  if (step.value === 'in_person') {
    return 'client-consent-sign-dialog'
  }

  return 'insurance-dialog app-dialog-card'
})

function applyClientNameDefault() {
  if (signerType.value !== consentSignerTypeValues.client) {
    return
  }
  const display = String(props.clientDisplayName ?? '').trim()
  if (display) {
    signerName.value = display
  }
  relationshipToClient.value = ''
}

function applyGuardianSignerDefaults() {
  if (!isGuardianSigner.value) {
    return false
  }
  const defaults = guardianSignerDefaults.value
  if (!defaults) {
    signerName.value = ''
    relationshipToClient.value = ''

    return false
  }
  signerName.value = defaults.signerName
  relationshipToClient.value = defaults.relationshipToClient

  return true
}

function applySignerDefaults() {
  if (signerType.value === consentSignerTypeValues.client) {
    applyClientNameDefault()

    return true
  }
  if (isGuardianSigner.value) {
    return applyGuardianSignerDefaults()
  }
  if (!String(signerName.value ?? '').trim()) {
    signerName.value = ''
  }

  return true
}

function resolveSecureLinkEmailFromContact() {
  return resolveConsentSecureLinkEmail(props.contactSection)
}

function applySecureLinkEmailDefault() {
  secureLinkEmail.value = resolveSecureLinkEmailFromContact()
}

function resetForm() {
  step.value = 'method'
  signerType.value = signerOptions.value[0]?.value
    || consentSignerTypeValues.client
  signatureMethod.value = consentSignatureMethodValues.inPersonDigital
  relationshipToClient.value = ''
  signatureArtifact.value = ''
  paperFile.value = null
  printing.value = false
  sendingLink.value = false
  secureLinkResult.value = null
  signerName.value = ''
  secureLinkEmail.value = ''
  applySignerDefaults()
}

watch(open, value => {
  if (value) {
    resetForm()
  }
})

watch(signerType, () => {
  if (step.value === 'in_person' || step.value === 'method') {
    applySignerDefaults()
  }
})

watch(signatureMethod, method => {
  if (!open.value || step.value !== 'method') {
    return
  }
  if (method === consentSignatureMethodValues.secureLink) {
    applySecureLinkEmailDefault()
  }
})

watch(
  () => props.contactSection,
  () => {
    if (!open.value || step.value !== 'method') {
      return
    }
    if (signatureMethod.value === consentSignatureMethodValues.secureLink) {
      applySecureLinkEmailDefault()
    }
    if (isGuardianSigner.value) {
      applyGuardianSignerDefaults()
    }
  },
  { deep: true },
)

function onCancel() {
  open.value = false
}

function onSecondary() {
  if (step.value === 'method' || step.value === 'secure_link_result') {
    onCancel()

    return
  }
  step.value = 'method'
}

function onMethodPrimary() {
  if (!canGoNext.value) {
    return
  }
  if (isInPersonSign.value) {
    if (!applySignerDefaults()) {
      return
    }
    step.value = 'in_person'

    return
  }
  if (isSecureLink.value) {
    void onSendSecureLink()
  }
}

function onConfirmInPerson() {
  if (!canSubmitInPerson.value) {
    return
  }
  const payload = {
    signerName: String(signerName.value).trim(),
    signerType: signerType.value,
    relationshipToClient: needsRelationship.value
      ? String(relationshipToClient.value).trim()
      : null,
    signatureMethod: signatureMethod.value,
  }
  if (isInPersonPaper.value) {
    payload.paperFile = paperFile.value
  } else {
    payload.signatureArtifact = signatureArtifact.value
  }
  emit('submit', payload)
}

async function onPrintPaper() {
  if (!canPrintPaper.value || printing.value) {
    return
  }
  printing.value = true
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
      props.consent.id,
      { version: props.consent.version },
    )
    triggerBlobDownload(blob, fileName)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: consentApiErrorMessage(
          error,
          t('clientConsentPrintError'),
        ),
      })
    }
  } finally {
    if (typeof dismissPrinting === 'function') {
      dismissPrinting()
    }
    printing.value = false
  }
}

async function onSendSecureLink() {
  if (!props.clientId || !props.consent?.id) {
    return
  }
  sendingLink.value = true
  try {
    const email = String(secureLinkEmail.value ?? '').trim()
    secureLinkResult.value = await sendClientConsentSecureLink(
      props.clientId,
      props.consent.id,
      {
        email,
        sendEmail: Boolean(email),
      },
    )
    step.value = 'secure_link_result'
    emit('secure-link-sent', secureLinkResult.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: consentApiErrorMessage(
          error,
          t('clientConsentSecureLinkError'),
        ),
      })
    }
  } finally {
    sendingLink.value = false
  }
}

async function onCopyLink() {
  const url = String(secureLinkResult.value?.secureLinkUrl ?? '').trim()
  if (!url) {
    return
  }
  try {
    await copyToClipboard(url)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clientConsentSecureLinkCopied'),
    })
  } catch {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('clientConsentSecureLinkCopyError'),
    })
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.client-consent-sign-dialog {
  display: flex;
  flex-direction: column;
  width: min(920px, 100%);
  max-width: 920px;
  height: min(920px, 100%);
  max-height: 100%;
  margin: 0 auto;
  background: $surface;
}

.client-consent-sign-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 16px 24px 20px;
}

.client-consent-sign-dialog__content {
  color: $text-strong;
  line-height: 1.55;
  font-size: 0.95rem;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 0 0 0.5rem;
    color: $text-strong;
    line-height: 1.25;
    font-weight: 650;
  }

  :deep(h1) {
    font-size: 1.25rem;
  }

  :deep(h2) {
    font-size: 1.1rem;
  }

  :deep(h3) {
    font-size: 1rem;
  }

  :deep(p) {
    margin: 0 0 0.75rem;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 0.75rem;
    padding-left: 1.25rem;
  }

  :deep(li) {
    margin-bottom: 0.35rem;
  }
}

.client-consent-sign-dialog__form {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid $border-subtle;
}

.client-consent-sign-dialog__print-col {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.client-consent-sign-dialog__actions {
  flex: 0 0 auto;
  background: $surface;
  border-top: 1px solid $border-subtle;
}
</style>
