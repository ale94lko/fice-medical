<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(tid.viewDialog)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card
      client-consent-view-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onClose">
        {{ consent?.consentName || t('clientConsentViewTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md
        client-consent-view-dialog__body">
        <div class="client-consent-view-dialog__meta row items-center
          q-gutter-sm q-mb-md">
          <AdminTableStatusCell
            :label="statusLabel"
            :variant="consentStatusVariant(consent?.status)"
          />
          <span
            v-if="consent?.version"
            class="client-consent-view-dialog__version text-body2
              text-grey-7">
            v{{ consent.version }}
          </span>
          <span
            v-if="consent?.required"
            class="client-consent-view-dialog__required">
            {{ t('consentTemplateRequired') }}
          </span>
        </div>

        <p
          v-if="signedMeta"
          class="text-body2 text-grey-7 q-mb-md">
          {{ signedMeta }}
        </p>
        <p
          v-if="revokedMeta"
          class="text-body2 text-grey-7 q-mb-md">
          {{ revokedMeta }}
        </p>

        <div
          class="client-consent-view-dialog__content"
          v-html="safeContentHtml"
        />
      </q-card-section>

      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('close')"
          @click="onClose"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import { consentStatusValues } from 'components/constants.js'
import { clientConsentsTestIds as tid, modalTestIds } from
  'src/test-ids/index.js'
import {
  consentStatusI18nKey,
  consentStatusVariant,
  formatConsentDateTime,
} from 'src/utils/consent-i18n.js'
import { sanitizeHtml } from 'src/utils/sanitize-html.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  consent: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])
const { t, te } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const safeContentHtml = computed(() => sanitizeHtml(
  props.consent?.contentHtml,
))

const statusLabel = computed(() => {
  const key = consentStatusI18nKey(props.consent?.status)

  return te(key) ? t(key) : (props.consent?.status || '—')
})

const signedMeta = computed(() => {
  if (props.consent?.status !== consentStatusValues.accepted) {
    return ''
  }
  if (!props.consent?.signedAt) {
    return ''
  }

  return t('clientConsentSignedMeta', {
    date: formatConsentDateTime(props.consent.signedAt),
    name: props.consent.signedByName || '—',
  })
})

const revokedMeta = computed(() => {
  if (props.consent?.status !== consentStatusValues.revoked) {
    return ''
  }

  return t('clientConsentRevokedMeta', {
    date: formatConsentDateTime(props.consent.revokedAt),
    reason: props.consent.revocationReason || '—',
  })
})

function onClose() {
  open.value = false
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.client-consent-view-dialog {
  display: flex;
  flex-direction: column;
  max-height: min(860px, 92vh);
}

.client-consent-view-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.client-consent-view-dialog__version {
  line-height: 1;
}

.client-consent-view-dialog__required {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba($primary, 0.12);
  color: $primary;
  font-size: 0.75rem;
  font-weight: 600;
}

.client-consent-view-dialog__content {
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
</style>
