<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    :data-testid="reviewDialogTestId"
    @update:model-value="v => emit('update:modelValue', v)">
    <q-card
      class="insurance-dialog app-dialog-card duplicate-match-review__card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('duplicateMatchReviewTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <AppLoadingOverlay :showing="loading" compact />

        <div
          v-if="!loading && previewForm && newForm"
          class="duplicate-match-review__sections">
          <div class="duplicate-match-review__summary-bar">
            <div class="duplicate-match-review__summary-left">
              <data-item-component
                icon="person"
                icon-size="80px"
                title-size="large"
                :title="existingClientDisplayName">
                <template #subTitle>
                  <div class="duplicate-match-review__badges-row">
                    <div class="duplicate-match-review__score-pill">
                      {{ matchScorePercent }}% Match
                    </div>
                    <div
                      class="duplicate-match-review__confidence-pill"
                      :class="confidencePillClass">
                      <q-icon
                        :name="confidenceIconName"
                        class="duplicate-match-review__confidence-pill-icon"
                        :style="{ color: confidenceIconColor }"
                        size="16px" />
                      <span
                        class="duplicate-match-review__confidence-pill-text">
                        {{ confidenceBadgeTerm }}
                      </span>
                    </div>
                  </div>
                </template>
                <template #actions>
                  <div class="duplicate-match-review__summary-cards">
                    <div
                      class="duplicate-match-review__stat-card
                        duplicate-match-review__stat-card--matched">
                      <div class="duplicate-match-review__stat-card-header">
                        <q-icon
                          name="check_circle"
                          class="duplicate-match-review__stat-card-icon
                            duplicate-match-review__stat-card-icon--match"
                          size="18px" />
                        <span class="duplicate-match-review__stat-card-title">
                          {{ t('duplicateMatchMatchedCardTitle', {
                            count: matchedFields.length,
                          }) }}
                        </span>
                      </div>
                      <div class="duplicate-match-review__stat-card-detail">
                        {{ matchedFields.join(', ') }}
                      </div>
                    </div>
                    <div
                      class="duplicate-match-review__stat-card
                  duplicate-match-review__stat-card--missing">
                      <div class="duplicate-match-review__stat-card-header">
                        <q-icon
                          name="warning"
                          class="duplicate-match-review__stat-card-icon
                      duplicate-match-review__stat-card-icon--missing"
                          size="18px" />
                        <span class="duplicate-match-review__stat-card-title">
                    {{ t('duplicateMatchMissingCardTitle', {
                          count: missingFields.length,
                        }) }}
                  </span>
                      </div>
                      <div class="duplicate-match-review__stat-card-detail">
                        {{ missingFields.join(', ') }}
                      </div>
                    </div>
                  </div>
                </template>
              </data-item-component>
            </div>
          </div>

          <p
            class="duplicate-match-review__compare-subtitle
              text-body2 text-grey-7 q-mt-lg q-mb-lg">
            {{ t('duplicateMatchReviewCompareSubtitle') }}
          </p>

          <div class="duplicate-match-review__compare-grid row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="duplicate-match-review__panel-header">
                <div class="row items-center q-col-gutter-sm no-wrap">
                  <q-icon
                    name="person"
                    class="duplicate-match-review__panel-header-icon"
                    size="22px" />
                  <div class="duplicate-match-review__panel-title">
                    {{ t('duplicateMatchExistingClientInformation') }}
                  </div>
                </div>
              </div>

              <div class="duplicate-match-review__panel-body">
                <div
                  v-for="row in compareRows"
                  :key="row.key"
                  class="duplicate-match-review__field-row">
                  <div class="duplicate-match-review__field-label">
                    {{ row.label }}
                  </div>
                  <div class="duplicate-match-review__field-value">
                    <span>{{ row.existingValueText }}</span>
                    <q-icon
                      :name="row.statusIconName"
                      :color="row.statusIconColor"
                      :style="{ color: row.statusIconColor }"
                      size="18px" />
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div
                class="duplicate-match-review__panel-header
                  duplicate-match-review__panel-header--new">
                <div class="row items-center q-col-gutter-sm no-wrap">
                  <q-icon
                    name="person"
                    class="duplicate-match-review__panel-header-icon"
                    size="22px" />
                  <div class="duplicate-match-review__panel-title">
                    {{ t('duplicateMatchNewClientInformation') }}
                  </div>
                </div>
              </div>

              <div class="duplicate-match-review__panel-body">
                <div
                  v-for="row in compareRows"
                  :key="row.key"
                  class="duplicate-match-review__field-row">
                  <div class="duplicate-match-review__field-label">
                    {{ row.label }}
                  </div>
                  <div class="duplicate-match-review__field-value">
                    <span>{{ row.newValueText }}</span>
                    <q-icon
                      :name="row.statusIconName"
                      :color="row.statusIconColor"
                      :style="{ color: row.statusIconColor }"
                      size="18px" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions duplicate-match-review__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="modalTestIds.cancel('duplicate-match-review')"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="tid.btnNotMatch"
          :label="t('duplicateMatchNotMatch')"
          @click="onNotMatch"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="tid.btnOpenExisting"
          :label="t('duplicateMatchOpenExisting')"
          @click="emit('open-existing')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import {
  clientFieldKeys as ck,
  clientFormSections,
} from 'components/constants.js'
import { modalTestIds } from 'src/test-ids/index.js'
import { addClientTestIds } from 'src/test-ids/index.js'
import {
  formatPhoneUs,
  normalizePhoneDigits,
} from 'src/utils/client-contact-form.js'
import DataItemComponent from 'components/template/DataItemComponent.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  previewForm: { type: Object, default: null },
  newForm: { type: Object, default: null },
  selectedMatch: { type: Object, default: null },
})

const emit = defineEmits([
  'update:modelValue',
  'cancel',
  'not-match',
  'open-existing',
])

const { t } = useI18n()
const tid = addClientTestIds.duplicateMatch

const reviewDialogTestId = modalTestIds.dialog('duplicate-match-review')

const contactExisting = computed(() => {
  const c = props.previewForm?.[clientFormSections.contact]
  if (!c || typeof c !== 'object') {
    return {}
  }

  return c
})

function trim(value) {
  return String(value ?? '').trim()
}

function isEmpty(value) {
  return trim(value).length === 0
}

function normalizeText(value) {
  return trim(value).toLowerCase()
}

function display(value) {
  const s = trim(value)
  return s || '—'
}

function displayPhone(contact) {
  const phones = contact?.phones ?? []
  const first = phones
    .map(p => normalizePhoneDigits(p?.number))
    .find(d => Boolean(d))

  if (!first) {
    return t('duplicateMatchNoPhones')
  }

  return formatPhoneUs(first)
}

function displayEmails(contact) {
  const emails = contact?.emails ?? []
  const first = emails
    .map(e => trim(e?.address))
    .find(a => Boolean(a))

  if (!first) {
    return t('duplicateMatchNoEmails')
  }

  return first
}

const contactNew = computed(() => {
  const c = props.newForm?.[clientFormSections.contact]
  if (!c || typeof c !== 'object') {
    return {}
  }

  return c
})

function valuesMatch(a, b) {
  if (isEmpty(a) || isEmpty(b)) {
    return false
  }
  return normalizeText(a) === normalizeText(b)
}

function fieldStatus(existingValue, newValue) {
  const existingEmpty = isEmpty(existingValue)
  const newEmpty = isEmpty(newValue)

  // Empty on both sides: show neutral (gray) instead of warning.
  if (existingEmpty && newEmpty) {
    return 'neutral'
  }

  // Middle name is optional, so empty handling is already covered above.
  if (!existingEmpty && !newEmpty && valuesMatch(existingValue, newValue)) {
    return 'match'
  }

  // For missing/unmatched, show warning.
  return 'missing'
}

const confidenceTier = computed(() => {
  const u = String(props.selectedMatch?.matchConfidence ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  if (u === 'HIGH' || u === 'ALTA') {
    return 'high'
  }
  if (u === 'MEDIUM' || u === 'MEDIA') {
    return 'medium'
  }
  if (u === 'LOW' || u === 'BAJA') {
    return 'low'
  }
  return 'unknown'
})

const confidenceIconColor = computed(() => {
  if (confidenceTier.value === 'high') {
    return '#16A34A'
  }
  if (confidenceTier.value === 'medium') {
    return '#0EA5E9'
  }
  if (confidenceTier.value === 'low') {
    return '#F59E0B'
  }
  return '#9CA3AF'
})

const confidencePillClass = computed(() => {
  if (confidenceTier.value === 'high') {
    return 'duplicate-match-review__confidence-pill--high'
  }
  if (confidenceTier.value === 'medium') {
    return 'duplicate-match-review__confidence-pill--medium'
  }
  if (confidenceTier.value === 'low') {
    return 'duplicate-match-review__confidence-pill--low'
  }
  return 'duplicate-match-review__confidence-pill--unknown'
})

const existingClientDisplayName = computed(() => {
  const first = trim(props.previewForm?.[ck.firstName])
  const middle = trim(props.previewForm?.[ck.middleName])
  const last = trim(props.previewForm?.[ck.lastName])

  const parts = [first, middle, last].filter(Boolean)
  return parts.length ? parts.join(' ') : '—'
})

const matchScorePercent = computed(
  () => Math.round(Number(props.selectedMatch?.matchScore) || 0),
)

const confidenceIconName = computed(() => {
  if (confidenceTier.value === 'high') {
    return 'check_circle'
  }
  if (confidenceTier.value === 'medium') {
    return 'cloud'
  }
  if (confidenceTier.value === 'low') {
    return 'warning'
  }

  return 'help'
})

const confidenceBadgeTerm = computed(() => {
  if (confidenceTier.value === 'high') {
    return t('duplicateMatchBadgePotentialDuplicate')
  }
  if (confidenceTier.value === 'medium') {
    return t('duplicateMatchBadgePossibleMatch')
  }
  if (confidenceTier.value === 'low') {
    return t('duplicateMatchBadgeLowConfidence')
  }

  return t('duplicateMatchConfidenceUnknown')
})

const compareRows = computed(() => {
  const existingContact = contactExisting.value ?? {}
  const newContact = contactNew.value ?? {}

  const rows = [
    {
      key: 'firstName',
      label: t('firstName'),
      existingValue: props.previewForm?.[ck.firstName],
      newValue: props.newForm?.[ck.firstName],
    },
    {
      key: 'middleName',
      label: t('middleName'),
      existingValue: props.previewForm?.[ck.middleName],
      newValue: props.newForm?.[ck.middleName],
      isMiddleName: true,
    },
    {
      key: 'lastName',
      label: t('lastName'),
      existingValue: props.previewForm?.[ck.lastName],
      newValue: props.newForm?.[ck.lastName],
    },
    {
      key: 'dob',
      label: t('dob'),
      existingValue: props.previewForm?.[ck.dob],
      newValue: props.newForm?.[ck.dob],
    },
    {
      key: 'addressLine1',
      label: t('duplicateMatchAddressShort'),
      existingValue: existingContact.addressLine1,
      newValue: newContact.addressLine1,
    },
    {
      key: 'city',
      label: t('city'),
      existingValue: existingContact.city,
      newValue: newContact.city,
    },
    {
      key: 'state',
      label: t('state'),
      existingValue: existingContact.state,
      newValue: newContact.state,
    },
    {
      key: 'zipCode',
      label: t('zipCode'),
      existingValue: existingContact.zipCode,
      newValue: newContact.zipCode,
    },
    {
      key: 'phone',
      label: t('duplicateMatchPhoneShort'),
      existingValue: displayPhone(existingContact),
      newValue: displayPhone(newContact),
      isPhoneEmail: true,
    },
    {
      key: 'email',
      label: t('duplicateMatchEmailShort'),
      existingValue: displayEmails(existingContact),
      newValue: displayEmails(newContact),
      isPhoneEmail: true,
    },
  ]

  return rows.map(r => {
    const status = r.isPhoneEmail
      ? ((r.existingValue === t('duplicateMatchNoPhones')
        && r.newValue === t('duplicateMatchNoPhones'))
        || (r.existingValue === t('duplicateMatchNoEmails')
          && r.newValue === t('duplicateMatchNoEmails'))
        ? 'neutral'
        : (valuesMatch(r.existingValue, r.newValue)
          ? 'match'
          : 'missing'))
      : fieldStatus(r.existingValue, r.newValue)

    const statusIconName = status === 'match'
      ? 'check_circle'
      : status === 'neutral'
        ? 'remove_circle'
        : 'warning'

    const statusIconColor = status === 'match'
      ? '#16A34A'
      : status === 'neutral'
        ? '#9CA3AF'
        : '#F59E0B'

    return {
      key: r.key,
      label: r.label,
      existingValueText: r.isPhoneEmail
        ? r.existingValue
        : display(r.existingValue),
      newValueText: r.isPhoneEmail
        ? r.newValue
        : display(r.newValue),
      status,
      statusIconName,
      statusIconColor,
    }
  })
})

const matchedFields = computed(() => compareRows.value
  .filter(r => r.status === 'match')
  .map(r => r.label))

const missingFields = computed(() => compareRows.value
  .filter(r => r.status === 'neutral')
  .map(r => r.label))

function onCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function onNotMatch() {
  emit('not-match')
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.duplicate-match-review__card {
  min-width: 680px;
  max-width: 980px;
}

.duplicate-match-review__summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 4px;
}

.duplicate-match-review__summary-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.duplicate-match-review__identity-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.duplicate-match-review__identity-person {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #E6FFFA;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.duplicate-match-review__identity-person-icon {
  color: #0D9488;
}

.duplicate-match-review__identity-name {
  font-weight: 700;
  color: #111827;
  font-size: 1.125rem;
  line-height: 1.2;
  white-space: nowrap;
}

.duplicate-match-review__badges-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.duplicate-match-review__score-pill {
  display: inline-flex;
  align-items: center;
  font-weight: 700;
  color: #111827;
  font-size: 0.8125rem;
  line-height: 1;
  padding: 7px 12px;
  border-radius: $radius-md;
  background: #E0F7FA;
  border: 1px solid #99F6E4;
  white-space: nowrap;
}

.duplicate-match-review__confidence-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: $radius-md;
  border: 1px solid transparent;
  white-space: nowrap;
}

.duplicate-match-review__confidence-pill--high {
  background: #EAF8F0;
  border-color: #B8E2C8;
}

.duplicate-match-review__confidence-pill--medium {
  background: #EFF6FF;
  border-color: #93C5FD;
}

.duplicate-match-review__confidence-pill--low {
  background: #FFF5E6;
  border-color: #F6D89B;
}

.duplicate-match-review__confidence-pill--unknown {
  background: #F3F4F6;
  border-color: #E5E7EB;
}

.duplicate-match-review__confidence-pill-text {
  font-weight: 700;
  color: #111827;
  font-size: 0.8125rem;
  line-height: 1;
}

.duplicate-match-review__summary-cards {
  display: flex;
  align-items: stretch;
  gap: 12px;
  flex-shrink: 0;
  width: calc(100% - 25px);
}

.duplicate-match-review__stat-card {
  border-radius: $radius-md;
  border: 1px solid #E5E7EB;
  padding: 12px 14px;
  min-width: 160px;
}

.duplicate-match-review__stat-card--matched {
  background: #EAF8F0;
  border-color: #B8E2C8;
}

.duplicate-match-review__stat-card--missing {
  background: #FFF5E6;
  border-color: #F6D89B;
}

.duplicate-match-review__stat-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.duplicate-match-review__stat-card-icon--match {
  color: #16A34A;
}

.duplicate-match-review__stat-card-icon--missing {
  color: #F59E0B;
}

.duplicate-match-review__stat-card-title {
  font-weight: 700;
  color: #111827;
  font-size: 0.8125rem;
  line-height: 1.2;
}

.duplicate-match-review__stat-card-detail {
  margin-top: 6px;
  font-weight: 500;
  color: #6B7280;
  font-size: 0.75rem;
  line-height: 1.3;
}

.duplicate-match-review__compare-subtitle {
  max-width: 720px;
}

.duplicate-match-review__panel-header {
  background: #F3F4F6;
  border-top-left-radius: $radius-md;
  border-top-right-radius: $radius-md;
  padding: 14px 16px;
  border: 1px solid #E5E7EB;
}

.duplicate-match-review__panel-header--new {
  background: #F9FAFB;
}

.duplicate-match-review__panel-header-icon {
  color: $primary;
}

.duplicate-match-review__panel-title {
  font-weight: 700;
  color: #111827;
}

.duplicate-match-review__panel-body {
  border-left: 1px solid $border-subtle;
  border-right: 1px solid $border-subtle;
  border-bottom: 1px solid $border-subtle;
  border-bottom-left-radius: $radius-md;
  border-bottom-right-radius: $radius-md;
  padding: 6px 16px;
}

.duplicate-match-review__field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #E5E7EB;
}

.duplicate-match-review__field-row:last-child {
  border-bottom: none;
}

.duplicate-match-review__field-label {
  font-weight: 600;
  color: #6B7280;
  font-size: 0.875rem;
}

.duplicate-match-review__field-value {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #111827;
  font-weight: 600;
  font-size: 0.875rem;
}

.duplicate-match-review__actions {
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 767px) {
  .duplicate-match-review__summary-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .duplicate-match-review__summary-cards {
    width: 100%;
  }

  .duplicate-match-review__stat-card {
    flex: 1;
    min-width: 0;
  }

  .duplicate-match-review__badges-row {
    padding-left: 0;
  }
}
</style>
