<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog clinical-audit-detail-dialog app-dialog-card"
      :data-testid="clinicalAuditTestIds.detailDialog">
      <AppDialogHeader
        :close-label="t('close')"
        :info="t('clinicalAuditDetailSubtitle')"
        :test-id="clinicalAuditTestIds.detailDialog"
        @close="onClose">
        {{ t('clinicalAuditDetailTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div v-if="loading" class="row flex-center q-pa-lg">
          <q-spinner color="primary" size="32px" />
        </div>

        <template v-else-if="record">
          <div class="clinical-audit-detail-dialog__grid">
            <div class="clinical-audit-detail-dialog__grid-cell">
              <div
                class="clinical-audit-detail-dialog__cell-icon
                  clinical-audit-detail-dialog__cell-icon--amber">
                <q-icon name="bolt" size="20px" />
              </div>
              <div class="clinical-audit-detail-dialog__cell-body">
                <p class="clinical-audit-detail-dialog__cell-label">
                  {{ t('clinicalAuditColAction') }}
                </p>
                <p class="clinical-audit-detail-dialog__cell-value">
                  {{ actionLabel(record.action) }}
                </p>
              </div>
            </div>

            <div class="clinical-audit-detail-dialog__grid-cell">
              <div
                class="clinical-audit-detail-dialog__cell-icon
                  clinical-audit-detail-dialog__cell-icon--purple">
                <q-icon name="account_tree" size="20px" />
              </div>
              <div class="clinical-audit-detail-dialog__cell-body">
                <p class="clinical-audit-detail-dialog__cell-label">
                  {{ t('clinicalAuditColEntityType') }}
                </p>
                <p class="clinical-audit-detail-dialog__cell-value">
                  {{ entityTypeLabel(record.entityType) }}
                </p>
              </div>
            </div>

            <div class="clinical-audit-detail-dialog__grid-cell">
              <div
                class="clinical-audit-detail-dialog__cell-icon
                  clinical-audit-detail-dialog__cell-icon--blue">
                <q-icon name="event" size="20px" />
              </div>
              <div class="clinical-audit-detail-dialog__cell-body">
                <p class="clinical-audit-detail-dialog__cell-label">
                  {{ t('clinicalAuditColCreatedAt') }}
                </p>
                <p class="clinical-audit-detail-dialog__cell-value">
                  {{ detailDateTime }}
                </p>
              </div>
            </div>

            <div class="clinical-audit-detail-dialog__grid-cell">
              <div
                class="clinical-audit-detail-dialog__cell-icon
                  clinical-audit-detail-dialog__cell-icon--teal">
                <q-icon name="category" size="20px" />
              </div>
              <div class="clinical-audit-detail-dialog__cell-body">
                <p class="clinical-audit-detail-dialog__cell-label">
                  {{ t('clinicalAuditColEntityId') }}
                </p>
                <p class="clinical-audit-detail-dialog__cell-value">
                  {{ nameOrDash(record.entityName) }}
                </p>
              </div>
            </div>

            <div class="clinical-audit-detail-dialog__grid-cell">
              <div
                class="clinical-audit-detail-dialog__cell-icon
                  clinical-audit-detail-dialog__cell-icon--blue">
                <q-icon name="person" size="20px" />
              </div>
              <div class="clinical-audit-detail-dialog__cell-body">
                <p class="clinical-audit-detail-dialog__cell-label">
                  {{ t('clinicalAuditColClientId') }}
                </p>
                <p class="clinical-audit-detail-dialog__cell-value">
                  {{ nameOrDash(record.clientName) }}
                </p>
              </div>
            </div>

            <div class="clinical-audit-detail-dialog__grid-cell">
              <div
                class="clinical-audit-detail-dialog__cell-icon
                  clinical-audit-detail-dialog__cell-icon--green">
                <q-icon name="badge" size="20px" />
              </div>
              <div class="clinical-audit-detail-dialog__cell-body">
                <p class="clinical-audit-detail-dialog__cell-label">
                  {{ t('clinicalAuditColChangedBy') }}
                </p>
                <p class="clinical-audit-detail-dialog__cell-value">
                  {{ nameOrDash(record.changedByName) }}
                </p>
              </div>
            </div>

            <div class="clinical-audit-detail-dialog__grid-cell">
              <div
                class="clinical-audit-detail-dialog__cell-icon
                  clinical-audit-detail-dialog__cell-icon--orange">
                <q-icon name="lan" size="20px" />
              </div>
              <div class="clinical-audit-detail-dialog__cell-body">
                <p class="clinical-audit-detail-dialog__cell-label">
                  {{ t('clinicalAuditColIp') }}
                </p>
                <p class="clinical-audit-detail-dialog__cell-value">
                  {{ record.ipAddress || '—' }}
                </p>
              </div>
            </div>

            <div class="clinical-audit-detail-dialog__grid-cell">
              <div
                class="clinical-audit-detail-dialog__cell-icon
                  clinical-audit-detail-dialog__cell-icon--purple">
                <q-icon name="link" size="20px" />
              </div>
              <div class="clinical-audit-detail-dialog__cell-body">
                <p class="clinical-audit-detail-dialog__cell-label">
                  {{ t('clinicalAuditColCorrelationId') }}
                </p>
                <p
                  class="clinical-audit-detail-dialog__cell-value
                    clinical-audit-detail-dialog__cell-value--mono">
                  {{ record.correlationId || '—' }}
                </p>
              </div>
            </div>
          </div>

          <div class="insurance-dialog__card-section q-mt-lg">
            <div class="clinical-audit-detail-dialog__changes-title">
              <q-icon name="code" size="18px" />
              <span>{{ t('clinicalAuditDetailSectionChanges') }}</span>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <div class="clinical-audit-detail-dialog__panel-head">
                  <div class="clinical-audit-detail-dialog__panel-title">
                    <span>{{ t('clinicalAuditBeforeJson') }}</span>
                    <span
                      class="clinical-audit-detail-dialog__panel-badge"
                      :class="hasBeforeJson
                        ? 'clinical-audit-detail-dialog__panel-badge--value'
                        : 'clinical-audit-detail-dialog__panel-badge--empty'">
                      {{ hasBeforeJson
                        ? t('clinicalAuditJsonHasValue')
                        : t('clinicalAuditJsonEmpty') }}
                    </span>
                  </div>
                  <q-btn
                    v-if="hasBeforeJson"
                    flat
                    dense
                    no-caps
                    color="primary"
                    icon="content_copy"
                    class="clinical-audit-detail-dialog__copy-btn"
                    :data-testid="clinicalAuditTestIds.copyJsonBefore"
                    :label="t('clinicalAuditCopyJson')"
                    @click="copyJson('before')"
                  />
                </div>
                <div
                  v-if="hasBeforeJson"
                  class="clinical-audit-detail-dialog__code">
                  <div
                    v-for="(row, index) in beforeJsonRows"
                    :key="`before-${index}`"
                    class="clinical-audit-detail-dialog__code-row">
                    <span class="clinical-audit-detail-dialog__code-ln">
                      {{ index + 1 }}
                    </span>
                    <span class="clinical-audit-detail-dialog__code-text">
                      <span
                        v-for="(part, partIndex) in row"
                        :key="`before-${index}-${partIndex}`"
                        :class="[
                          'clinical-audit-detail-dialog__tok',
                          `clinical-audit-detail-dialog__tok--${part.type}`,
                        ]">{{ part.text }}</span>
                    </span>
                  </div>
                </div>
                <div
                  v-else
                  class="clinical-audit-detail-dialog__empty">
                  <q-icon name="inventory_2" size="36px" />
                  <p class="clinical-audit-detail-dialog__empty-title">
                    {{ t('clinicalAuditJsonEmptyTitle') }}
                  </p>
                  <p class="clinical-audit-detail-dialog__empty-hint">
                    {{ t('clinicalAuditJsonEmptyBeforeHint') }}
                  </p>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="clinical-audit-detail-dialog__panel-head">
                  <div class="clinical-audit-detail-dialog__panel-title">
                    <span>{{ t('clinicalAuditAfterJson') }}</span>
                    <span
                      class="clinical-audit-detail-dialog__panel-badge"
                      :class="hasAfterJson
                        ? 'clinical-audit-detail-dialog__panel-badge--value'
                        : 'clinical-audit-detail-dialog__panel-badge--empty'">
                      {{ hasAfterJson
                        ? t('clinicalAuditJsonNewValue')
                        : t('clinicalAuditJsonEmpty') }}
                    </span>
                  </div>
                  <q-btn
                    v-if="hasAfterJson"
                    flat
                    dense
                    no-caps
                    color="primary"
                    icon="content_copy"
                    class="clinical-audit-detail-dialog__copy-btn"
                    :data-testid="clinicalAuditTestIds.copyJsonAfter"
                    :label="t('clinicalAuditCopyJson')"
                    @click="copyJson('after')"
                  />
                </div>
                <div
                  v-if="hasAfterJson"
                  class="clinical-audit-detail-dialog__code">
                  <div
                    v-for="(row, index) in afterJsonRows"
                    :key="`after-${index}`"
                    class="clinical-audit-detail-dialog__code-row">
                    <span class="clinical-audit-detail-dialog__code-ln">
                      {{ index + 1 }}
                    </span>
                    <span class="clinical-audit-detail-dialog__code-text">
                      <span
                        v-for="(part, partIndex) in row"
                        :key="`after-${index}-${partIndex}`"
                        :class="[
                          'clinical-audit-detail-dialog__tok',
                          `clinical-audit-detail-dialog__tok--${part.type}`,
                        ]">{{ part.text }}</span>
                    </span>
                  </div>
                </div>
                <div
                  v-else
                  class="clinical-audit-detail-dialog__empty">
                  <q-icon name="inventory_2" size="36px" />
                  <p class="clinical-audit-detail-dialog__empty-title">
                    {{ t('clinicalAuditJsonEmptyTitle') }}
                  </p>
                  <p class="clinical-audit-detail-dialog__empty-hint">
                    {{ t('clinicalAuditJsonEmptyAfterHint') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div
          v-else
          class="text-body2 text-grey-7 q-pa-md">
          {{ t('clinicalAuditDetailEmpty') }}
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          class="app-btn-primary"
          :data-testid="clinicalAuditTestIds.detailClose"
          :label="t('close')"
          @click="onClose"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { copyToClipboard, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import { getAppDateTimeConfig } from 'src/utils/app-datetime.js'
import {
  clinicalAuditActionI18nKey,
  clinicalAuditEntityI18nKey,
  formatClinicalAuditDetailDateTime,
  formatClinicalAuditJson,
  highlightClinicalAuditJsonLine,
} from 'src/utils/clinical-audit-normalize.js'
import { clinicalAuditTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  record: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t, te } = useI18n()
const $q = useQuasar()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const detailDateTime = computed(() => (
  formatClinicalAuditDetailDateTime(
    props.record?.createdAt,
    getAppDateTimeConfig().timezone,
  )
))

const beforeJsonText = computed(() => (
  formatClinicalAuditJson(props.record?.beforeJson)
))

const afterJsonText = computed(() => (
  formatClinicalAuditJson(props.record?.afterJson)
))

const hasBeforeJson = computed(() => Boolean(beforeJsonText.value))

const hasAfterJson = computed(() => Boolean(afterJsonText.value))

const beforeJsonRows = computed(() => {
  if (!beforeJsonText.value) {
    return []
  }

  return beforeJsonText.value
    .split('\n')
    .map(line => highlightClinicalAuditJsonLine(line))
})

const afterJsonRows = computed(() => {
  if (!afterJsonText.value) {
    return []
  }

  return afterJsonText.value
    .split('\n')
    .map(line => highlightClinicalAuditJsonLine(line))
})

function nameOrDash(name) {
  const label = String(name ?? '').trim()

  return label || '—'
}

function actionLabel(action) {
  const token = String(action ?? '').trim()
  if (!token) {
    return '—'
  }
  const key = clinicalAuditActionI18nKey(token)

  return key && te(key) ? t(key) : token
}

function entityTypeLabel(entityType) {
  const token = String(entityType ?? '').trim()
  if (!token) {
    return '—'
  }
  const key = clinicalAuditEntityI18nKey(token)

  return key && te(key) ? t(key) : token
}

function copyJson(side) {
  const text = side === 'before'
    ? beforeJsonText.value
    : afterJsonText.value
  if (!text) {
    return
  }

  copyToClipboard(text)
    .then(() => {
      $q.notify({
        type: 'positive',
        message: t('clinicalAuditCopyJsonSuccess'),
      })
    })
    .catch(() => {
      $q.notify({
        type: 'negative',
        message: t('clinicalAuditCopyJsonError'),
      })
    })
}

function onClose() {
  open.value = false
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.clinical-audit-detail-dialog {
  width: min(1024px, 96vw);
  max-width: 1024px;
}

.clinical-audit-detail-dialog__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 16px;
}

.clinical-audit-detail-dialog__grid-cell {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  padding: 4px 0;
}

.clinical-audit-detail-dialog__cell-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.clinical-audit-detail-dialog__cell-icon--teal {
  background: rgba($primary, 0.12);
  color: $primary;
}

.clinical-audit-detail-dialog__cell-icon--blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.clinical-audit-detail-dialog__cell-icon--green {
  background: #dcfce7;
  color: #166534;
}

.clinical-audit-detail-dialog__cell-icon--orange {
  background: #ffedd5;
  color: #c2410c;
}

.clinical-audit-detail-dialog__cell-icon--amber {
  background: #fef3c7;
  color: #b45309;
}

.clinical-audit-detail-dialog__cell-icon--purple {
  background: #ede9fe;
  color: #6d28d9;
}

.clinical-audit-detail-dialog__cell-body {
  min-width: 0;
}

.clinical-audit-detail-dialog__cell-label {
  margin: 0 0 2px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  color: $text-muted;
}

.clinical-audit-detail-dialog__cell-value {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.35;
  color: $text-strong;
  word-break: break-word;
}

.clinical-audit-detail-dialog__cell-value--mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.8125rem;
  font-weight: 500;
}

.clinical-audit-detail-dialog__changes-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.9375rem;
  font-weight: 700;
  color: $text-strong;
}

.clinical-audit-detail-dialog__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  min-height: 28px;
}

.clinical-audit-detail-dialog__panel-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: $text-strong;
}

.clinical-audit-detail-dialog__panel-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.2;
}

.clinical-audit-detail-dialog__panel-badge--empty {
  background: #f1f5f9;
  color: #64748b;
}

.clinical-audit-detail-dialog__panel-badge--value {
  background: #dcfce7;
  color: #166534;
}

.clinical-audit-detail-dialog__copy-btn {
  font-size: 0.75rem;
}

.clinical-audit-detail-dialog__code {
  margin: 0;
  min-height: 180px;
  max-height: 360px;
  overflow: auto;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.55;
}

.clinical-audit-detail-dialog__code-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  min-height: 1.55em;
}

.clinical-audit-detail-dialog__code-ln {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 0 10px 0 8px;
  background: #eef2f6;
  border-right: 1px solid #e2e8f0;
  color: #64748b;
  user-select: none;
}

.clinical-audit-detail-dialog__code-text {
  padding: 0 12px;
  white-space: pre-wrap;
  word-break: break-word;
  color: #0f172a;
}

.clinical-audit-detail-dialog__tok--key {
  color: #2563eb;
}

.clinical-audit-detail-dialog__tok--string {
  color: #16a34a;
}

.clinical-audit-detail-dialog__tok--number {
  color: #c2410c;
}

.clinical-audit-detail-dialog__tok--literal {
  color: #7c3aed;
}

.clinical-audit-detail-dialog__tok--plain {
  color: #0f172a;
}

.clinical-audit-detail-dialog__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 180px;
  padding: 24px 16px;
  border: 1px dashed $border-subtle;
  border-radius: $radius-md;
  background: $surface-muted;
  color: $text-muted;
  text-align: center;
}

.clinical-audit-detail-dialog__empty-title {
  margin: 4px 0 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: $text-strong;
}

.clinical-audit-detail-dialog__empty-hint {
  margin: 0;
  max-width: 260px;
  font-size: 0.75rem;
  line-height: 1.4;
  color: $text-muted;
}

@media (max-width: 1023px) {
  .clinical-audit-detail-dialog__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .clinical-audit-detail-dialog__grid {
    grid-template-columns: 1fr;
  }
}
</style>
