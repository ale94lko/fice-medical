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
                  {{ t('clinicalAuditColPerformedBy') }}
                </p>
                <p class="clinical-audit-detail-dialog__cell-value">
                  {{ performedByLabel }}
                </p>
              </div>
            </div>

            <div
              v-if="triggeredByLabel"
              class="clinical-audit-detail-dialog__grid-cell">
              <div
                class="clinical-audit-detail-dialog__cell-icon
                  clinical-audit-detail-dialog__cell-icon--teal">
                <q-icon name="play_arrow" size="20px" />
              </div>
              <div class="clinical-audit-detail-dialog__cell-body">
                <p class="clinical-audit-detail-dialog__cell-label">
                  {{ t('clinicalAuditColTriggeredBy') }}
                </p>
                <p class="clinical-audit-detail-dialog__cell-value">
                  {{ triggeredByLabel }}
                </p>
              </div>
            </div>

            <div class="clinical-audit-detail-dialog__grid-cell">
              <div
                class="clinical-audit-detail-dialog__cell-icon
                  clinical-audit-detail-dialog__cell-icon--purple">
                <q-icon name="hub" size="20px" />
              </div>
              <div class="clinical-audit-detail-dialog__cell-body">
                <p class="clinical-audit-detail-dialog__cell-label">
                  {{ t('clinicalAuditColSource') }}
                </p>
                <p class="clinical-audit-detail-dialog__cell-value">
                  {{ sourceLabel }}
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

            <div
              v-if="isAccessOnly"
              class="clinical-audit-detail-dialog__access">
              <q-icon name="visibility" size="20px" />
              <p class="q-mb-none">
                {{ t('clinicalAuditAccessOnlyHint') }}
              </p>
            </div>

            <template v-else>
              <div
                v-if="changeRows.length || hasBeforeJson || hasAfterJson"
                class="clinical-audit-diff__toolbar">
                <div class="clinical-audit-diff__filters">
                  <button
                    v-for="chip in kindFilterChips"
                    v-show="changeRows.length"
                    :key="chip.kind"
                    type="button"
                    class="clinical-audit-diff__chip"
                    :class="[
                      `clinical-audit-diff__chip--${chip.kind}`,
                      {
                        'clinical-audit-diff__chip--active':
                          isKindFilterActive(chip.kind),
                      },
                    ]"
                    :data-testid="clinicalAuditTestIds.diffFilter(
                      chip.kind,
                    )"
                    @click="toggleKindFilter(chip.kind)">
                    {{ chip.label }}
                  </button>
                </div>
                <q-btn
                  v-if="hasBeforeJson || hasAfterJson"
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon="code"
                  class="clinical-audit-diff__raw-btn"
                  :data-testid="clinicalAuditTestIds.toggleRawJson"
                  :label="rawJsonToggleLabel"
                  @click="showRawJson = !showRawJson"
                />
              </div>

              <div
                v-if="visibleChangeRows.length"
                class="clinical-audit-diff q-mb-md">
                <div class="clinical-audit-diff__head">
                  <span>{{ t('clinicalAuditDiffField') }}</span>
                  <span>{{ t('clinicalAuditDiffKind') }}</span>
                  <span>{{ t('clinicalAuditBeforeJson') }}</span>
                  <span>{{ t('clinicalAuditAfterJson') }}</span>
                </div>
                <div
                  v-for="row in visibleChangeRows"
                  :key="row.path"
                  class="clinical-audit-diff__row"
                  :class="clinicalAuditChangeKindClass(row.kind)">
                  <span class="clinical-audit-diff__path">
                    {{ row.path }}
                  </span>
                  <span
                    class="clinical-audit-diff__kind"
                    :class="`clinical-audit-diff__kind--${row.kind}`">
                    <q-icon
                      :name="kindIcon(row.kind)"
                      size="16px"
                    />
                    {{ kindLabel(row.kind) }}
                  </span>
                  <span
                    class="clinical-audit-diff__value"
                    :class="{
                      'clinical-audit-diff__value--previous':
                        row.kind === 'changed',
                      'clinical-audit-diff__value--removed':
                        row.kind === 'removed',
                    }">
                    {{ row.before || '—' }}
                  </span>
                  <span
                    class="clinical-audit-diff__value"
                    :class="{
                      'clinical-audit-diff__value--added':
                        row.kind === 'added',
                      'clinical-audit-diff__value--changed':
                        row.kind === 'changed',
                    }">
                    {{ row.after || '—' }}
                  </span>
                </div>
              </div>
              <p
                v-else-if="changeRows.length"
                class="text-body2 text-grey-7 q-mb-md">
                {{ t('clinicalAuditDiffFilterEmpty') }}
              </p>
            </template>

            <div
              v-if="showRawJson && !isAccessOnly"
              class="row q-col-gutter-md">
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
import { computed, ref, watch } from 'vue'
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
import {
  clinicalAuditChangeKindClass,
  diffClinicalAuditPayloads,
  isClinicalAuditAccessOnly,
} from 'src/utils/clinical-audit-diff.js'
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

const showRawJson = ref(false)
const kindFilters = ref(defaultKindFilters())

const isAccessOnly = computed(() =>
  isClinicalAuditAccessOnly(props.record),
)

const changeRows = computed(() => {
  if (isAccessOnly.value) {
    return []
  }

  return diffClinicalAuditPayloads(
    props.record?.beforeJson,
    props.record?.afterJson,
  ).filter(row => row.kind !== 'unchanged')
})

const addedCount = computed(() =>
  countChangeKind(changeRows.value, 'added'),
)
const changedCount = computed(() =>
  countChangeKind(changeRows.value, 'changed'),
)
const removedCount = computed(() =>
  countChangeKind(changeRows.value, 'removed'),
)

const kindFilterChips = computed(() => [
  {
    kind: 'added',
    label: t('clinicalAuditDiffFilterAdded', {
      count: addedCount.value,
    }),
  },
  {
    kind: 'changed',
    label: t('clinicalAuditDiffFilterChanged', {
      count: changedCount.value,
    }),
  },
  {
    kind: 'removed',
    label: t('clinicalAuditDiffFilterRemoved', {
      count: removedCount.value,
    }),
  },
])

const visibleChangeRows = computed(() => {
  const active = kindFilters.value
  if (!active.length) {
    return []
  }

  return changeRows.value.filter(row => active.includes(row.kind))
})

const rawJsonToggleLabel = computed(() => (
  showRawJson.value
    ? t('clinicalAuditHideRawJson')
    : t('clinicalAuditViewRawJson')
))

watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      return
    }
    showRawJson.value = false
    kindFilters.value = defaultKindFilters()
  },
)

const performedByLabel = computed(() => {
  const source = String(props.record?.source ?? '').trim().toUpperCase()
  if (source === 'SYSTEM' && !props.record?.changedByName) {
    return t('clinicalAuditPerformedBySystem')
  }

  return nameOrDash(props.record?.changedByName)
})

const triggeredByLabel = computed(() => {
  const label = String(props.record?.triggeredByName ?? '').trim()

  return label
})

const sourceLabel = computed(() => {
  const token = String(props.record?.source ?? '').trim().toUpperCase()
  if (token === 'SYSTEM') {
    return t('clinicalAuditSourceSystem')
  }
  if (token === 'AI') {
    return t('clinicalAuditSourceAi')
  }
  if (token === 'INTEGRATION') {
    return t('clinicalAuditSourceIntegration')
  }

  return t('clinicalAuditSourceUser')
})

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

function kindLabel(kind) {
  if (kind === 'added') {
    return t('clinicalAuditDiffAdded')
  }
  if (kind === 'changed') {
    return t('clinicalAuditDiffChanged')
  }
  if (kind === 'removed') {
    return t('clinicalAuditDiffRemoved')
  }

  return t('clinicalAuditDiffUnchanged')
}

function kindIcon(kind) {
  if (kind === 'added') {
    return 'add'
  }
  if (kind === 'removed') {
    return 'remove'
  }

  return 'fiber_manual_record'
}

function defaultKindFilters() {
  return ['added', 'changed', 'removed']
}

function countChangeKind(rows, kind) {
  return rows.filter(row => row.kind === kind).length
}

function isKindFilterActive(kind) {
  return kindFilters.value.includes(kind)
}

function toggleKindFilter(kind) {
  if (isKindFilterActive(kind)) {
    kindFilters.value = kindFilters.value.filter(item => item !== kind)

    return
  }
  kindFilters.value = [...kindFilters.value, kind]
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

.clinical-audit-detail-dialog__access {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-muted;
  color: $text-strong;
  font-size: 0.875rem;
  line-height: 1.4;
}

.clinical-audit-diff__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.clinical-audit-diff__filters {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.clinical-audit-diff__chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  opacity: 0.45;
}

.clinical-audit-diff__chip--active {
  opacity: 1;
}

.clinical-audit-diff__chip--added {
  background: #dcfce7;
  color: #166534;
}

.clinical-audit-diff__chip--changed {
  background: #ffedd5;
  color: #c2410c;
}

.clinical-audit-diff__chip--removed {
  background: #fee2e2;
  color: #b91c1c;
}

.clinical-audit-diff__raw-btn {
  font-size: 0.75rem;
}

.clinical-audit-diff {
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  overflow: hidden;
  font-size: 0.875rem;
}

.clinical-audit-diff__head,
.clinical-audit-diff__row {
  display: grid;
  grid-template-columns:
    minmax(0, 1.3fr) 110px minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  padding: 8px 12px;
}

.clinical-audit-diff__head {
  background: rgba($primary, 0.08);
  font-weight: 600;
  color: $text-strong;
}

.clinical-audit-diff__row {
  border-top: 1px solid $border-subtle;
}

.clinical-audit-diff__path {
  font-weight: 600;
  word-break: break-word;
}

.clinical-audit-diff__value {
  word-break: break-word;
}

.clinical-audit-diff__value--previous {
  color: #1d4ed8;
}

.clinical-audit-diff__value--added {
  color: #166534;
  font-weight: 600;
}

.clinical-audit-diff__value--changed {
  color: #c2410c;
  font-weight: 600;
}

.clinical-audit-diff__value--removed {
  color: #dc2626;
  text-decoration: line-through;
}

.clinical-audit-diff__row--added {
  background: #f0fdf4;
}

.clinical-audit-diff__row--changed {
  background: #fff7ed;
}

.clinical-audit-diff__row--removed {
  background: #fef2f2;
}

.clinical-audit-diff__kind {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.clinical-audit-diff__kind--added {
  color: #166534;
}

.clinical-audit-diff__kind--changed {
  color: #c2410c;
}

.clinical-audit-diff__kind--removed {
  color: #b91c1c;
}

@media (max-width: 899px) {
  .clinical-audit-diff__head,
  .clinical-audit-diff__row {
    grid-template-columns: minmax(0, 1fr) 96px;
  }

  .clinical-audit-diff__head span:nth-child(n+3),
  .clinical-audit-diff__row span:nth-child(n+3) {
    grid-column: 1 / -1;
  }
}

</style>
