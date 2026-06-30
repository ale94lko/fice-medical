<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="appointment-detail-dialog insurance-dialog app-dialog-card">
      <header class="appointment-detail-dialog__header">
        <div class="appointment-detail-dialog__header-icon">
          <q-icon name="event" size="22px" />
        </div>
        <div class="appointment-detail-dialog__header-copy">
          <h2 class="appointment-detail-dialog__title">
            {{ t('appointmentDetailTitle') }}
          </h2>
          <p class="appointment-detail-dialog__subtitle">
            {{ t('appointmentDetailSubtitle') }}
          </p>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          class="appointment-detail-dialog__close"
          :aria-label="t('close')"
          @click="onClose"
        />
      </header>

      <q-card-section
        class="app-dialog-card__body appointment-detail-dialog__body
          q-px-lg q-pt-md q-pb-md">
        <div class="appointment-detail-dialog__hero">
          <div class="appointment-detail-dialog__hero-card">
            <div class="appointment-detail-dialog__hero-icon">
              <q-icon name="assignment" size="20px" />
            </div>
            <div>
              <p class="appointment-detail-dialog__hero-label">
                {{ t('appointmentDetailNumberLabel') }}
              </p>
              <div class="appointment-detail-dialog__hero-value-row">
                <p class="appointment-detail-dialog__hero-value">
                  {{ record?.appointmentNumber || '—' }}
                </p>
                <q-btn
                  v-if="record?.appointmentNumber"
                  flat
                  round
                  dense
                  size="sm"
                  icon="content_copy"
                  :aria-label="t('copy')"
                  @click="copyAppointmentNumber"
                />
              </div>
            </div>
          </div>

          <div
            class="appointment-detail-dialog__hero-card
              appointment-detail-dialog__hero-card--status"
            :class="statusCardClass">
            <div
              class="appointment-detail-dialog__hero-icon"
              :class="statusIconClass">
              <q-icon :name="statusMeta.icon" size="20px" />
            </div>
            <div>
              <p
                class="appointment-detail-dialog__hero-status-title"
                :class="statusTitleClass">
                {{ statusLabel(record?.status) }}
              </p>
              <p class="appointment-detail-dialog__hero-status-hint">
                {{ statusHint }}
              </p>
            </div>
          </div>
        </div>

        <div class="appointment-detail-dialog__grid">
          <div class="appointment-detail-dialog__grid-cell">
            <div
              class="appointment-detail-dialog__cell-icon
                appointment-detail-dialog__cell-icon--blue">
              <q-icon name="medical_services" />
            </div>
            <div>
              <p class="appointment-detail-dialog__cell-label">
                {{ t('appointmentDetailServicesLabel') }}
              </p>
              <p class="appointment-detail-dialog__cell-value">
                {{ servicesSummary }}
              </p>
            </div>
          </div>

          <div class="appointment-detail-dialog__grid-cell">
            <div
              class="appointment-detail-dialog__cell-icon
                appointment-detail-dialog__cell-icon--green">
              <q-icon name="person" />
            </div>
            <div>
              <p class="appointment-detail-dialog__cell-label">
                {{ t('appointmentDetailClinicianLabel') }}
              </p>
              <p class="appointment-detail-dialog__cell-value">
                {{ record?.clinicianDisplayName || '—' }}
              </p>
              <p class="appointment-detail-dialog__cell-hint">
                {{ clinicianHint }}
              </p>
            </div>
          </div>

          <div class="appointment-detail-dialog__grid-cell">
            <div
              class="appointment-detail-dialog__cell-icon
                appointment-detail-dialog__cell-icon--purple">
              <q-icon name="event" />
            </div>
            <div>
              <p class="appointment-detail-dialog__cell-label">
                {{ t('appointmentColDateTime') }}
              </p>
              <p class="appointment-detail-dialog__cell-value">
                {{ dateLabel }}
                <span
                  v-if="durationLabel"
                  class="appointment-detail-dialog__duration-chip">
                  {{ durationLabel }}
                </span>
              </p>
              <p class="appointment-detail-dialog__cell-hint">
                {{ timeLabel }}
              </p>
            </div>
          </div>

          <div class="appointment-detail-dialog__grid-cell">
            <div
              class="appointment-detail-dialog__cell-icon
                appointment-detail-dialog__cell-icon--blue">
              <q-icon name="place" />
            </div>
            <div>
              <p class="appointment-detail-dialog__cell-label">
                {{ t('appointmentPlaceOfService') }}
              </p>
              <p class="appointment-detail-dialog__cell-value">
                {{ record?.placeOfServiceName || '—' }}
              </p>
            </div>
          </div>

          <div class="appointment-detail-dialog__grid-cell">
            <div
              class="appointment-detail-dialog__cell-icon
                appointment-detail-dialog__cell-icon--orange">
              <q-icon name="groups" />
            </div>
            <div>
              <p class="appointment-detail-dialog__cell-label">
                {{ t('appointmentColReferral') }}
              </p>
              <p class="appointment-detail-dialog__cell-value">
                {{ referralValue }}
              </p>
              <p class="appointment-detail-dialog__cell-hint">
                {{ referralHint }}
              </p>
            </div>
          </div>

          <div class="appointment-detail-dialog__grid-cell">
            <div
              class="appointment-detail-dialog__cell-icon
                appointment-detail-dialog__cell-icon--teal">
              <q-icon name="place" />
            </div>
            <div>
              <p class="appointment-detail-dialog__cell-label">
                {{ t('appointmentDetailLocationLabel') }}
              </p>
              <p class="appointment-detail-dialog__cell-value">
                {{ t('appointmentDetailLocationName') }}
              </p>
              <p class="appointment-detail-dialog__cell-hint">
                {{ t('appointmentDetailLocationAddress') }}
              </p>
            </div>
          </div>
        </div>

        <div class="appointment-detail-dialog__lower">
          <section class="appointment-detail-dialog__notes-card">
            <h3 class="appointment-detail-dialog__section-heading">
              <q-icon name="sticky_note_2" size="18px" />
              {{ t('appointmentNotesOptional') }}
            </h3>
            <p class="appointment-detail-dialog__notes-body">
              {{ record?.notes || t('appointmentDetailNotesEmpty') }}
            </p>
          </section>

          <aside class="appointment-detail-dialog__aside-card">
            <div class="appointment-detail-dialog__aside-list">
              <div class="appointment-detail-dialog__aside-item">
                <div
                  class="appointment-detail-dialog__aside-icon
                    appointment-detail-dialog__cell-icon--blue">
                  <q-icon name="schedule" size="18px" />
                </div>
                <div>
                  <p class="appointment-detail-dialog__aside-title">
                    {{ t('appointmentDetailAsideCalendarTitle') }}
                  </p>
                  <p class="appointment-detail-dialog__aside-text">
                    {{ t('appointmentDetailAsideCalendarText') }}
                  </p>
                </div>
              </div>

              <div class="appointment-detail-dialog__aside-item">
                <div
                  class="appointment-detail-dialog__aside-icon
                    appointment-detail-dialog__cell-icon--green">
                  <q-icon name="notifications_none" size="18px" />
                </div>
                <div>
                  <p class="appointment-detail-dialog__aside-title">
                    {{ t('appointmentDetailAsideRemindersTitle') }}
                  </p>
                  <p class="appointment-detail-dialog__aside-text">
                    {{ t('appointmentDetailAsideRemindersText') }}
                  </p>
                </div>
              </div>

              <div class="appointment-detail-dialog__aside-item">
                <div
                  class="appointment-detail-dialog__aside-icon
                    appointment-detail-dialog__cell-icon--purple">
                  <q-icon name="info" size="18px" />
                </div>
                <div>
                  <p class="appointment-detail-dialog__aside-title">
                    {{ t('appointmentDetailAsideChangesTitle') }}
                  </p>
                  <p class="appointment-detail-dialog__aside-text">
                    {{ t('appointmentDetailAsideChangesText') }}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="app-dialog-card__actions appointment-detail-dialog__actions">
        <div class="appointment-detail-dialog__actions-left">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            icon="print"
            :label="t('appointmentDetailPrint')"
            @click="onPrint"
          />
        </div>
        <div class="appointment-detail-dialog__actions-right">
          <q-btn
            no-caps
            flat
            class="app-btn-outline"
            :label="t('close')"
            @click="onClose"
          />
          <q-btn
            v-if="canViewClient && record?.clientId"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="person"
            :label="t('appointmentDetailViewClient')"
            @click="onViewClient"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { copyToClipboard, useQuasar } from 'quasar'
import { appointmentStatuses } from 'components/constants.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
} from 'src/utils/appointment-datetime.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const router = useRouter()
const $q = useQuasar()
const { canViewClient } = useClientPermissions()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const dateLabel = computed(() =>
  formatUtcDateLong(props.record?.startAtUtc) || '—',
)

const timeLabel = computed(() =>
  formatUtcTimeRange(props.record?.startAtUtc, props.record?.endAtUtc) || '—',
)

const durationLabel = computed(() => {
  const minutes = Number(props.record?.durationMin)
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return ''
  }

  return t('appointmentDurationMinutes', { count: minutes })
})

const servicesSummary = computed(() => {
  const lines = props.record?.serviceProcedures ?? []
  if (lines.length) {
    return lines
      .map(line => {
        const cpt = line.cptCode ? ` — CPT ${line.cptCode}` : ''

        return `${line.name}${cpt}`
      })
      .join(', ')
  }

  return props.record?.appointmentTypeName || '—'
})

const referralValue = computed(() =>
  props.record?.referralLabel
  ?? props.record?.referralNumber
  ?? '—',
)

const referralHint = computed(() =>
  referralValue.value === '—'
    ? t('appointmentDetailReferralEmpty')
    : t('appointmentDetailReferralLinked'),
)

const clinicianHint = computed(() =>
  props.record?.clinicianDisplayName
    ? t('appointmentDetailClinicianHint')
    : t('appointmentDetailClinicianEmpty'),
)

const statusMeta = computed(() => {
  const status = String(props.record?.status ?? '').toUpperCase()

  if (status === appointmentStatuses.checkedIn) {
    return {
      icon: 'how_to_reg',
      tone: 'checked-in',
      hintKey: 'appointmentDetailStatusCheckedInHint',
    }
  }
  if (status === appointmentStatuses.completed) {
    return {
      icon: 'task_alt',
      tone: 'completed',
      hintKey: 'appointmentDetailStatusCompletedHint',
    }
  }
  if (status === appointmentStatuses.cancelled) {
    return {
      icon: 'cancel',
      tone: 'cancelled',
      hintKey: 'appointmentDetailStatusCancelledHint',
    }
  }
  if (status === appointmentStatuses.noShow) {
    return {
      icon: 'person_off',
      tone: 'no-show',
      hintKey: 'appointmentDetailStatusNoShowHint',
    }
  }
  if (status === appointmentStatuses.pending) {
    return {
      icon: 'schedule',
      tone: 'pending',
      hintKey: 'appointmentDetailStatusPendingHint',
    }
  }

  return {
    icon: 'check_circle',
    tone: 'confirmed',
    hintKey: 'appointmentDetailStatusConfirmedHint',
  }
})

const statusCardClass = computed(() =>
  `appointment-detail-dialog__hero-card--status--${statusMeta.value.tone}`,
)

const statusIconClass = computed(() =>
  `appointment-detail-dialog__hero-icon--status-${statusMeta.value.tone}`,
)

const statusTitleClass = computed(() => {
  const tone = statusMeta.value.tone
  if (tone === 'cancelled' || tone === 'no-show') {
    return 'text-negative'
  }
  if (tone === 'completed') {
    return 'text-grey-8'
  }
  if (tone === 'pending') {
    return 'text-warning'
  }

  return 'text-positive'
})

const statusHint = computed(() => t(statusMeta.value.hintKey))

function statusLabel(status) {
  const key = `appointmentStatus${String(status ?? '')
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join('')}`

  return t(key)
}

function onClose() {
  open.value = false
}

function copyAppointmentNumber() {
  const value = props.record?.appointmentNumber
  if (!value) {
    return
  }

  copyToClipboard(String(value))
    .then(() => {
      $q.notify({
        type: 'positive',
        message: t('appointmentDetailCopiedNumber'),
      })
    })
    .catch(() => {
      $q.notify({
        type: 'negative',
        message: t('appointmentDetailCopyError'),
      })
    })
}

function onPrint() {
  window.print()
}

function onViewClient() {
  const clientId = props.record?.clientId
  if (!clientId) {
    return
  }

  open.value = false
  void router.push({ path: `/clients/${clientId}` })
}
</script>
