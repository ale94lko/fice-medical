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
        <q-inner-loading :showing="loading" color="primary">
          <q-spinner size="40px" />
        </q-inner-loading>

        <div
          v-if="!loading && previewForm && newForm"
          class="duplicate-match-review__sections">
          <div class="duplicate-match-review__summary-row row q-col-gutter-md">
            <div class="col-12 col-md-6 col-lg-3">
              <div
                class="duplicate-match-review__summary-card
                  duplicate-match-review__summary-card--score">
                <q-icon
                  name="check_circle"
                  class="duplicate-match-review__summary-icon
                    duplicate-match-review__summary-icon--match"
                  size="20px" />
                <div class="duplicate-match-review__summary-text">
                  {{ matchScorePercent }}% Match
                </div>
              </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
              <div
                class="duplicate-match-review__summary-card
                  duplicate-match-review__summary-card--confidence">
                <q-icon
                  :name="confidenceIconName"
                  class="duplicate-match-review__summary-icon
                    duplicate-match-review__summary-icon--missing"
                  size="20px" />
                <div class="duplicate-match-review__summary-text">
                  {{ confidenceBadgeTerm }}
                </div>
              </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
              <div
                class="duplicate-match-review__summary-card
                  duplicate-match-review__summary-card--matched">
                <q-icon
                  name="check_circle"
                  class="duplicate-match-review__summary-icon
                    duplicate-match-review__summary-icon--match"
                  size="20px" />
                <div class="duplicate-match-review__summary-text">
                  {{ t('duplicateMatchMatchedCardTitle', {
                    count: matchedFields.length,
                  }) }}
                </div>
                <div class="duplicate-match-review__summary-list">
                  {{ matchedFields.join(', ') }}
                </div>
              </div>
            </div>

            <div class="col-12 col-md-6 col-lg-3">
              <div
                class="duplicate-match-review__summary-card
                  duplicate-match-review__summary-card--missing">
                <q-icon
                  name="warning"
                  class="duplicate-match-review__summary-icon
                    duplicate-match-review__summary-icon--missing"
                  size="20px" />
                <div class="duplicate-match-review__summary-text">
                  {{ t('duplicateMatchMissingCardTitle', {
                    count: missingFields.length,
                  }) }}
                </div>
                <div class="duplicate-match-review__summary-list">
                  {{ missingFields.join(', ') }}
                </div>
              </div>
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

function fieldStatus(existingValue, newValue, fieldKey) {
  const existingEmpty = isEmpty(existingValue)
  const newEmpty = isEmpty(newValue)

  // Middle name is optional: show neutral when both are empty.
  if (fieldKey === ck.middleName) {
    if (existingEmpty && newEmpty) {
      return 'neutral'
    }
    if (!existingEmpty && !newEmpty && valuesMatch(existingValue, newValue)) {
      return 'match'
    }
    return 'missing'
  }

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
      ? (r.existingValue === t('duplicateMatchNoPhones')
        && r.newValue === t('duplicateMatchNoPhones'))
        || (r.existingValue === t('duplicateMatchNoEmails')
          && r.newValue === t('duplicateMatchNoEmails'))
        ? 'missing'
        : (valuesMatch(r.existingValue, r.newValue)
          ? 'match'
          : 'missing')
      : fieldStatus(r.existingValue, r.newValue, r.key === 'middleName'
        ? ck.middleName
        : r.key)

    const statusIconName = status === 'match'
      ? 'check_circle'
      : status === 'neutral'
        ? 'remove_circle'
        : 'warning'

    const statusIconColor = status === 'match'
      ? '#16A34A'
      : status === 'neutral'
        ? '#6B7280'
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
      statusIconName,
      statusIconColor,
    }
  })
})

const matchedFields = computed(() => {
  const first = compareRows.value.find(r => r.key === 'firstName')
  const last = compareRows.value.find(r => r.key === 'lastName')
  const out = []
  if (first?.statusIconName === 'check_circle') {
    out.push(t('firstName'))
  }
  if (last?.statusIconName === 'check_circle') {
    out.push(t('lastName'))
  }
  return out
})

const missingFields = computed(() => {
  const dobRow = compareRows.value.find(r => r.key === 'dob')
  const addrRow = compareRows.value.find(r => r.key === 'addressLine1')
  const phoneRow = compareRows.value.find(r => r.key === 'phone')
  const emailRow = compareRows.value.find(r => r.key === 'email')
  const out = []
  if (dobRow && dobRow.statusIconName !== 'check_circle') {
    out.push(t('dob'))
  }
  if (phoneRow && phoneRow.statusIconName !== 'check_circle') {
    out.push(t('duplicateMatchPhoneShort'))
  }
  if (emailRow && emailRow.statusIconName !== 'check_circle') {
    out.push(t('duplicateMatchEmailShort'))
  }
  if (addrRow && addrRow.statusIconName !== 'check_circle') {
    out.push(t('duplicateMatchAddressShort'))
  }
  return out
})

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

.duplicate-match-review__summary-row {
  margin-top: 8px;
}

.duplicate-match-review__summary-card {
  background: #fff;
  border-radius: $radius-md;
  border: 1px solid #E5E7EB;
  padding: 14px 14px;
}

.duplicate-match-review__summary-text {
  font-weight: 700;
  color: #111827;
  font-size: 0.875rem;
  line-height: 1.2;
  margin-top: 6px;
}

.duplicate-match-review__summary-list {
  margin-top: 8px;
  font-weight: 600;
  color: #6B7280;
  font-size: 0.75rem;
  line-height: 1.2;
}

.duplicate-match-review__summary-icon {
  vertical-align: middle;
}

.duplicate-match-review__summary-icon--match {
  color: #16A34A;
}

.duplicate-match-review__summary-icon--missing {
  color: #F59E0B;
}

.duplicate-match-review__summary-card--confidence {
  background: #FFF5E6;
  border-color: #F6D89B;
}

.duplicate-match-review__summary-card--matched {
  border-color: #B8E2C8;
  background: #EAF8F0;
}

.duplicate-match-review__summary-card--missing {
  border-color: #F6D89B;
  background: #FFF5E6;
}

.duplicate-match-review__compare-subtitle {
  max-width: 720px;
}

.duplicate-match-review__panel-header {
  background: #F3F4F6;
  border-radius: $radius-md;
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
  margin-top: 12px;
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
</style>
