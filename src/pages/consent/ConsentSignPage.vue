<template>
  <div
    class="consent-sign-page"
    :data-testid="telehealthTestIds.signPage">
    <header class="consent-sign-page__topbar">
      <div class="consent-sign-page__brand">
        <q-icon name="verified_user" size="18px" />
        <span>{{ t('consentSignPublicBrand') }}</span>
      </div>
    </header>

    <main class="consent-sign-page__main">
      <div
        v-if="phase === 'loading'"
        class="consent-sign-card flex flex-center">
        <AppBrandLoading inline />
      </div>

      <div
        v-else-if="phase === 'error'"
        class="consent-sign-card">
        <h1>{{ t('consentSignPublicErrorTitle') }}</h1>
        <p>{{ errorMessage }}</p>
      </div>

      <div
        v-else-if="phase === 'signed'"
        class="consent-sign-card">
        <h1>{{ t('consentSignPublicSignedTitle') }}</h1>
        <p>{{ t('consentSignPublicSignedBody') }}</p>
      </div>

      <div
        v-else-if="phase === 'declined'"
        class="consent-sign-card">
        <h1>{{ t('consentSignPublicDeclinedTitle') }}</h1>
        <p>{{ t('consentSignPublicDeclinedBody') }}</p>
      </div>

      <div
        v-else
        class="consent-sign-card consent-sign-card--wide">
        <h1>{{ preview?.consentName || t('consentSignPublicTitle') }}</h1>
        <p
          v-if="metaLine"
          class="consent-sign-card__meta">
          {{ metaLine }}
        </p>

        <div
          class="consent-sign-card__content"
          v-html="safeContentHtml"
        />

        <div class="consent-sign-card__tabs q-mt-lg">
          <q-btn-toggle
            v-model="mode"
            no-caps
            dense
            unelevated
            toggle-color="primary"
            color="grey-3"
            text-color="grey-9"
            :data-testid="telehealthTestIds.signMode"
            :options="modeOptions"
          />
        </div>

        <div
          v-if="mode === 'sign'"
          class="consent-sign-card__form q-mt-md">
          <div class="row q-col-gutter-md">
            <div class="col-12">
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
            <div class="col-12">
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
            <div
              v-if="needsRelationship"
              class="col-12">
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
              v-if="preview?.signatureRequired"
              class="col-12">
              <SignatureCanvas
                v-model="signatureArtifact"
                size="tall"
                :hint="t('clientConsentSignatureHint')"
              />
            </div>
          </div>
          <div class="consent-sign-card__actions q-mt-lg">
            <q-btn
              no-caps
              unelevated
              color="primary"
              class="app-btn-primary full-width"
              :data-testid="telehealthTestIds.signSubmit"
              :label="t('clientConsentSignConfirm')"
              :loading="submitting"
              :disable="!canSign"
              @click="onSign"
            />
          </div>
        </div>

        <div
          v-else
          class="consent-sign-card__form q-mt-md">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <FormField
                required
                :label="t('consentSignPublicDeclinedBy')">
                <TextInput
                  v-model="declinedByName"
                  outlined
                  dense
                  hide-bottom-space
                  :maxlength="consentSignerNameMaxLength"
                />
              </FormField>
            </div>
            <div class="col-12">
              <FormField
                required
                :label="t('consentSignPublicDeclineReason')">
                <TextInput
                  v-model="declineReason"
                  outlined
                  dense
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  :maxlength="consentRevocationReasonMaxLength"
                />
              </FormField>
            </div>
          </div>
          <div class="consent-sign-card__actions q-mt-lg">
            <q-btn
              no-caps
              unelevated
              color="negative"
              class="full-width"
              :data-testid="telehealthTestIds.signDecline"
              :label="t('clientConsentDecline')"
              :loading="submitting"
              :disable="!canDecline"
              @click="onDecline"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AppBrandLoading from 'components/AppBrandLoading.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import SignatureCanvas from 'components/SignatureCanvas.vue'
import TextInput from 'components/TextInput.vue'
import {
  consentRelationshipMaxLength,
  consentRevocationReasonMaxLength,
  consentSignerNameMaxLength,
  consentSignerTypeValues,
  consentStatusValues,
} from 'components/constants.js'
import {
  consentPublicErrorKey,
  declineConsentPublic,
  previewConsentPublic,
  signConsentPublic,
} from 'src/utils/consent-api.js'
import {
  buildConsentSignerTypeOptions,
  consentStatusI18nKey,
  consentTypeI18nKey,
} from 'src/utils/consent-i18n.js'
import { sanitizeHtml } from 'src/utils/sanitize-html.js'
import { telehealthTestIds } from 'src/test-ids/index.js'

const { t, te } = useI18n()
const route = useRoute()

const phase = ref('loading')
const errorMessage = ref('')
const preview = ref(null)
const mode = ref('sign')
const submitting = ref(false)

const signerName = ref('')
const signerType = ref(consentSignerTypeValues.client)
const relationshipToClient = ref('')
const signatureArtifact = ref('')
const declinedByName = ref('')
const declineReason = ref('')

const tenantKey = computed(() => String(
  route.query.tenant
  ?? route.query.tenant_key
  ?? '',
).trim())

const subtenantKey = computed(() => String(
  route.query.subtenant
  ?? route.query.subtenant_key
  ?? '',
).trim())

const token = computed(() => String(route.query.token ?? '').trim())

const signerOptions = computed(() => buildConsentSignerTypeOptions(
  t,
  te,
  preview.value?.allowedSignerTypes,
))

const needsRelationship = computed(
  () => signerType.value !== consentSignerTypeValues.client,
)

const modeOptions = computed(() => [
  { label: t('consentSignPublicModeSign'), value: 'sign' },
  { label: t('consentSignPublicModeDecline'), value: 'decline' },
])

const safeContentHtml = computed(() => sanitizeHtml(
  preview.value?.contentHtml,
))

const metaLine = computed(() => {
  if (!preview.value) {
    return ''
  }
  const parts = []
  if (preview.value.consentType) {
    const key = consentTypeI18nKey(preview.value.consentType)
    parts.push(te(key) ? t(key) : preview.value.consentType)
  }
  if (preview.value.version) {
    parts.push(`v${preview.value.version}`)
  }
  if (preview.value.status) {
    const key = consentStatusI18nKey(preview.value.status)
    parts.push(te(key) ? t(key) : preview.value.status)
  }

  return parts.join(' · ')
})

const canSign = computed(() => {
  if (!String(signerName.value ?? '').trim()) {
    return false
  }
  if (!signerType.value) {
    return false
  }
  if (needsRelationship.value
    && !String(relationshipToClient.value ?? '').trim()) {
    return false
  }
  if (preview.value?.signatureRequired
    && !String(signatureArtifact.value ?? '').trim()) {
    return false
  }

  return true
})

const canDecline = computed(() => {
  if (!String(declinedByName.value ?? '').trim()) {
    return false
  }
  if (!String(declineReason.value ?? '').trim()) {
    return false
  }

  return true
})

function setError(error) {
  const key = consentPublicErrorKey(error)
  errorMessage.value = te(key) ? t(key) : t('consentSignPublicErrorGeneric')
  phase.value = 'error'
}

async function loadPreview() {
  if (!tenantKey.value || !subtenantKey.value || !token.value) {
    errorMessage.value = t('consentSignPublicErrorInvalid')
    phase.value = 'error'

    return
  }
  phase.value = 'loading'
  try {
    preview.value = await previewConsentPublic({
      tenantKey: tenantKey.value,
      subtenantKey: subtenantKey.value,
      token: token.value,
    })
    const allowed = preview.value.allowedSignerTypes
    signerType.value = allowed?.[0] || consentSignerTypeValues.client
    if (preview.value.status
      && preview.value.status !== consentStatusValues.pendingSignature) {
      errorMessage.value = t('consentSignPublicErrorNotPending')
      phase.value = 'error'

      return
    }
    phase.value = 'form'
  } catch (error) {
    setError(error)
  }
}

async function onSign() {
  if (!canSign.value) {
    return
  }
  submitting.value = true
  try {
    await signConsentPublic({
      tenantKey: tenantKey.value,
      subtenantKey: subtenantKey.value,
      token: token.value,
      signerName: String(signerName.value).trim(),
      signerType: signerType.value,
      relationshipToClient: needsRelationship.value
        ? String(relationshipToClient.value).trim()
        : null,
      signatureArtifact: preview.value?.signatureRequired
        ? signatureArtifact.value
        : undefined,
    })
    phase.value = 'signed'
  } catch (error) {
    setError(error)
  } finally {
    submitting.value = false
  }
}

async function onDecline() {
  if (!canDecline.value) {
    return
  }
  submitting.value = true
  try {
    await declineConsentPublic({
      tenantKey: tenantKey.value,
      subtenantKey: subtenantKey.value,
      token: token.value,
      declinedByName: String(declinedByName.value).trim(),
      declineReason: String(declineReason.value).trim(),
    })
    phase.value = 'declined'
  } catch (error) {
    setError(error)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void loadPreview()
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.consent-sign-page {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba($primary, 0.08) 0%, $surface 42%);
  color: $text-strong;
}

.consent-sign-page__topbar {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 10px 16px;
  border-bottom: 1px solid $border-subtle;
  background: rgba($surface, 0.92);
}

.consent-sign-page__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 650;
  font-size: 0.95rem;
}

.consent-sign-page__main {
  padding: 16px;
  max-width: 720px;
  margin: 0 auto;
}

.consent-sign-card {
  background: $surface;
  border: 1px solid $border-subtle;
  border-radius: 12px;
  padding: 20px 16px 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);

  h1 {
    margin: 0 0 8px;
    font-size: 1.35rem;
    line-height: 1.25;
    font-weight: 650;
  }

  p {
    margin: 0;
    color: $text-muted;
    line-height: 1.5;
  }
}

.consent-sign-card--wide {
  @media (min-width: 600px) {
    padding: 24px 28px 28px;
  }
}

.consent-sign-card__meta {
  margin-bottom: 16px !important;
  font-size: 0.875rem;
}

.consent-sign-card__content {
  color: $text-strong;
  line-height: 1.55;
  font-size: 0.95rem;
  padding-top: 4px;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 0 0 0.5rem;
    line-height: 1.25;
    font-weight: 650;
  }

  :deep(h1) {
    font-size: 1.2rem;
  }

  :deep(h2) {
    font-size: 1.05rem;
  }

  :deep(p),
  :deep(ul),
  :deep(ol) {
    margin: 0 0 0.75rem;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 1.25rem;
  }
}

.consent-sign-card__tabs {
  display: flex;
}

.consent-sign-card__actions {
  display: flex;
}
</style>
