<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="appointment-detail-dialog insurance-dialog app-dialog-card">
      <AppDialogHeader
        test-id="appointment-detail"
        :close-label="t('close')"
        :info="t('appointmentDetailSubtitle')"
        @close="onClose">
        <div class="row items-center no-wrap">
          <div class="appointment-detail-dialog__header-icon q-mr-sm">
            <q-icon name="event" size="22px" />
          </div>
          <span>{{ t('appointmentDetailTitle') }}</span>
        </div>
      </AppDialogHeader>

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
                  {{ detailRecord?.appointmentNumber || '—' }}
                </p>
                <q-btn
                  v-if="detailRecord?.appointmentNumber"
                  flat
                  round
                  dense
                  size="sm"
                  icon="content_copy"
                  :aria-label="t('copy')"
                  :data-testid="tid.copyNumber"
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
              <p class="appointment-detail-dialog__hero-label">
                {{ t('appointmentDetailStatusLabel') }}
              </p>
              <p
                class="appointment-detail-dialog__hero-status-title"
                :class="statusTitleClass">
                {{ statusLabel(detailRecord?.status) }}
              </p>
              <p class="appointment-detail-dialog__hero-status-hint">
                {{ statusHint }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="appointment-detail-dialog__people relative-position"
          :class="{
            'appointment-detail-dialog__people--single':
              !showInsuranceSection,
          }">
          <section
            class="appointment-detail-dialog__person-card"
            :data-testid="tid.clientCard">
            <div class="appointment-detail-dialog__person-head">
              <div
                class="appointment-detail-dialog__avatar"
                aria-hidden="true">
                <StoredFileAvatar
                  v-if="clientHeader?.photoFileId"
                  :file-id="clientHeader.photoFileId"
                  spinner-size="22px">
                  <template #placeholder>
                    <span>
                      {{ clientHeader?.clientInitials || '?' }}
                    </span>
                  </template>
                </StoredFileAvatar>
                <span v-else>
                  {{ clientHeader?.clientInitials || '?' }}
                </span>
              </div>
              <div>
                <p class="appointment-detail-dialog__person-kicker">
                  {{ t('appointmentDetailClientLabel') }}
                </p>
                <p class="appointment-detail-dialog__person-name">
                  {{ clientHeader?.fullName
                    || detailRecord?.clientDisplayName
                    || '—' }}
                </p>
              </div>
            </div>
            <ul class="appointment-detail-dialog__facts">
              <li v-if="clientHeader?.dobAgeLine">
                <q-icon name="event" size="16px" />
                <span>{{ clientHeader.dobAgeLine }}</span>
              </li>
              <li v-if="clientHeader?.gender">
                <q-icon
                  :name="clientHeader.genderIcon || 'person'"
                  size="16px"
                />
                <span>{{ clientHeader.gender }}</span>
              </li>
              <li v-if="clientHeader?.phone">
                <q-icon name="phone" size="16px" />
                <span>{{ clientHeader.phone }}</span>
              </li>
              <li
                v-if="clientHeader?.addressLine"
                class="appointment-detail-dialog__fact--wide">
                <q-icon name="place" size="16px" />
                <span>{{ clientHeader.addressLine }}</span>
              </li>
            </ul>
          </section>

          <section
            v-if="showInsuranceSection"
            class="appointment-detail-dialog__person-card
              appointment-detail-dialog__person-card--insurance"
            :data-testid="tid.insuranceCard">
            <div class="appointment-detail-dialog__person-head">
              <div
                class="appointment-detail-dialog__avatar
                  appointment-detail-dialog__avatar--shield">
                <q-icon name="verified_user" size="20px" />
              </div>
              <div>
                <p class="appointment-detail-dialog__person-kicker">
                  {{ t('appointmentDetailInsuranceLabel') }}
                </p>
              </div>
            </div>
            <p
              v-if="!insuranceView || insuranceView.empty"
              class="appointment-detail-dialog__empty">
              {{ t('appointmentDetailInsuranceEmpty') }}
            </p>
            <template v-else>
              <dl class="appointment-detail-dialog__insurance-grid">
                <div>
                  <dt>{{ t('appointmentDetailInsurancePayer') }}</dt>
                  <dd>{{ insuranceView.payer || '—' }}</dd>
                </div>
                <div>
                  <dt>{{ t('insuranceMemberId') }}</dt>
                  <dd>{{ insuranceView.memberId || '—' }}</dd>
                </div>
                <div
                  v-if="insuranceView.serviceId"
                  class="appointment-detail-dialog__insurance-pair--wide">
                  <dt>
                    {{ t('appointmentDetailInsuranceServiceId') }}
                    <q-icon name="info" size="14px">
                      <q-tooltip class="app-info-tooltip">
                        {{ t('appointmentDetailInsuranceServiceIdHint') }}
                      </q-tooltip>
                    </q-icon>
                  </dt>
                  <dd>{{ insuranceView.serviceId }}</dd>
                </div>
              </dl>
              <div
                v-if="insuranceView.showSubscriber"
                class="appointment-detail-dialog__subscriber">
                <q-icon name="person" size="16px" />
                <span class="appointment-detail-dialog__subscriber-title">
                  {{ t('appointmentDetailSubscriberNotClient') }}
                </span>
                <span class="appointment-detail-dialog__subscriber-name">
                  {{ insuranceView.subscriberName || '—' }}
                </span>
                <span
                  v-if="insuranceView.relationship"
                  class="appointment-detail-dialog__chip">
                  {{ insuranceView.relationship }}
                </span>
              </div>
            </template>
          </section>
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
                {{ detailRecord?.clinicianDisplayName || '—' }}
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
              <p class="appointment-detail-dialog__cell-value">
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
                {{ placeOfServiceLabel }}
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
                {{ location.name }}
              </p>
              <p class="appointment-detail-dialog__cell-hint">
                {{ location.address }}
              </p>
            </div>
          </div>

          <div
            v-if="showTelehealthSection"
            class="appointment-detail-dialog__grid-cell
              appointment-detail-dialog__grid-cell--telehealth">
            <div
              class="appointment-detail-dialog__cell-icon
                appointment-detail-dialog__cell-icon--teal">
              <q-icon name="videocam" />
            </div>
            <div class="appointment-detail-dialog__telehealth">
              <p class="appointment-detail-dialog__cell-label">
                {{ t('appointmentDetailTelehealthVisit') }}
              </p>
              <div class="appointment-detail-dialog__hero-value-row">
                <p class="appointment-detail-dialog__cell-value">
                  {{ t('appointmentDetailTelehealthViaPortal') }}
                </p>
                <q-btn
                  v-if="telehealthInviteUrl"
                  flat
                  round
                  dense
                  size="sm"
                  icon="content_copy"
                  :aria-label="t('telehealthCopyClientLink')"
                  :data-testid="tid.copyInvite"
                  @click="onCopyInvite"
                >
                  <q-tooltip
                    class="app-info-tooltip"
                    anchor="top middle"
                    self="bottom middle"
                    :offset="[0, 6]">
                    {{ t('telehealthCopyClientLink') }}
                  </q-tooltip>
                </q-btn>
              </div>
              <p class="appointment-detail-dialog__cell-hint">
                {{ invitePending
                  ? t('telehealthInvitePending')
                  : t('appointmentDetailTelehealthJoinHint') }}
              </p>
            </div>
          </div>
        </div>

        <section class="appointment-detail-dialog__notes-card">
          <h3 class="appointment-detail-dialog__section-heading">
            <q-icon name="sticky_note_2" size="18px" />
            {{ t('appointmentNotesOptional') }}
          </h3>
          <p
            class="appointment-detail-dialog__notes-body"
            :class="{
              'appointment-detail-dialog__notes-body--empty':
                !detailRecord?.notes,
            }">
            {{ detailRecord?.notes || t('appointmentDetailNotesEmpty') }}
          </p>
        </section>
      </q-card-section>

      <q-card-actions
        align="right"
        class="app-dialog-card__actions appointment-detail-dialog__actions">
        <div class="appointment-detail-dialog__actions-left">
          <GenerateDocumentAction
            v-if="appointmentId"
            :document-type="documentTypes.appointmentSummary"
            :context="{ appointmentId }"
            :label="t('generateDocumentAction')"
            button-class="app-btn-outline"
          />
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            icon="print"
            :label="t('appointmentDetailPrint')"
            :data-testid="tid.print"
            @click="onPrint"
          />
        </div>
        <div class="appointment-detail-dialog__actions-right">
          <q-btn
            v-if="showEncounterButton"
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            icon="medical_services"
            :label="t('startEncounterButton')"
            :loading="encounterBusy"
            :data-testid="tid.encounter"
            @click="onEncounter"
          />
          <q-btn
            v-if="showStaffTelehealthJoin"
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            icon="videocam"
            :label="t('telehealthJoinFromAppointment')"
            :data-testid="tid.joinTelehealth"
            @click="onJoinStaffTelehealth"
          />
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('close')"
            :data-testid="tid.close"
            @click="onClose"
          />
          <q-btn
            v-if="canViewClient && detailRecord?.clientId"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="person"
            :label="t('appointmentDetailViewClient')"
            :data-testid="tid.viewClient"
            @click="onViewClient"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <StartEncounterDialog
    v-model="encounterDialogOpen"
    :client-id="clientChartId"
    :preset-appointment-id="appointmentId"
    :preset-encounter-type="encounterTypes.scheduled"
    :saving="encounterBusy"
    @submit="onEncounterSubmit"
  />
</template>

<script setup>
import { computed, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { copyToClipboard, useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'
import StartEncounterDialog from 'components/StartEncounterDialog.vue'
import {
  appointmentStatuses,
  encounterTypes,
  quasarNotifyTypes,
  telehealthRoles,
} from 'components/constants.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
} from 'src/utils/appointment-datetime.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'
import { useTelehealthPermissions } from
  'src/composables/useTelehealthPermissions.js'
import { useAppointmentDetailExtras } from
  'src/composables/useAppointmentDetailExtras.js'
import { useActiveEncounter } from
  'src/composables/useActiveEncounter.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import GenerateDocumentAction from
  'components/documents/GenerateDocumentAction.vue'
import { documentTypes } from 'src/utils/document-generation-constants.js'
import {
  canStartTelehealthForAppointmentStatus,
  isTelemedicineAppointment,
} from 'src/utils/telehealth-normalize.js'
import {
  copyTelehealthInviteUrl,
} from 'src/utils/telehealth-appointment-ui.js'
import { formatAppointmentServicesSummary } from
  'src/utils/appointment-detail-display.js'
import { buildQuickStartEncounterPayload } from
  'src/utils/start-encounter-quick.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { clientChartKey } from 'components/helpers.js'
import { appointmentTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const { linkedStaffProfile } = storeToRefs(authStore)
const { canViewClient } = useClientPermissions()
const {
  canCreateTelehealth,
  canJoinTelehealth,
} = useTelehealthPermissions()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const {
  detailRecord,
  clientChartId,
  clientHeader,
  insuranceView,
  showInsuranceSection,
  location,
} = useAppointmentDetailExtras(open, toRef(props, 'record'))

const {
  canStartEncounter,
  hasActiveEncounter,
  activeEncounterId,
  startEncounter,
  actionBusy: encounterBusy,
  refreshActiveEncounter,
} = useActiveEncounter(clientChartId)

const encounterDialogOpen = ref(false)

const appointmentId = computed(() =>
  detailRecord.value?.appointmentId ?? detailRecord.value?.id ?? null,
)

const telehealthInviteUrl = computed(() =>
  String(detailRecord.value?.telehealthInviteUrl ?? '').trim(),
)

const telehealthSessionId = computed(() =>
  detailRecord.value?.telehealthSessionId ?? null,
)

const showTelehealthSection = computed(() =>
  isTelemedicineAppointment(detailRecord.value),
)

const invitePending = computed(() =>
  showTelehealthSection.value && !telehealthSessionId.value,
)

const showStaffTelehealthJoin = computed(() => {
  if (!telehealthSessionId.value) {
    return false
  }
  if (!(canJoinTelehealth.value || canCreateTelehealth.value)) {
    return false
  }
  if (!canStartTelehealthForAppointmentStatus(detailRecord.value?.status)) {
    return false
  }

  return showTelehealthSection.value
})

const showEncounterButton = computed(() =>
  canStartEncounter.value && Boolean(clientChartId.value),
)

const placeOfServiceLabel = computed(() =>
  detailRecord.value?.placeOfServiceDisplayName
  || detailRecord.value?.placeOfServiceName
  || '—',
)

const dateLabel = computed(() =>
  formatUtcDateLong(detailRecord.value?.startAtUtc) || '—',
)

const timeLabel = computed(() =>
  formatUtcTimeRange(
    detailRecord.value?.startAtUtc,
    detailRecord.value?.endAtUtc,
  ) || '—',
)

const durationLabel = computed(() => {
  const minutes = Number(detailRecord.value?.durationMin)
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return ''
  }

  return t('appointmentDurationMinutes', { count: minutes })
})

const servicesSummary = computed(() =>
  formatAppointmentServicesSummary(detailRecord.value, t),
)

const clinicianHint = computed(() =>
  detailRecord.value?.clinicianDisplayName
    ? t('appointmentDetailClinicianHint')
    : t('appointmentDetailClinicianEmpty'),
)

const statusMeta = computed(() => resolveStatusMeta(detailRecord.value?.status))

const statusCardClass = computed(() =>
  `appointment-detail-dialog__hero-card--status--${statusMeta.value.tone}`,
)

const statusIconClass = computed(() =>
  `appointment-detail-dialog__hero-icon--status-${statusMeta.value.tone}`,
)

const statusTitleClass = computed(() =>
  `appointment-detail-dialog__hero-status-title--${statusMeta.value.tone}`,
)

const statusHint = computed(() => t(statusMeta.value.hintKey))

watch(open, isOpen => {
  if (isOpen && clientChartId.value) {
    void refreshActiveEncounter()
  }
})

function resolveStatusMeta(status) {
  const value = String(status ?? '').toUpperCase()
  if (value === appointmentStatuses.confirmed
    || value === appointmentStatuses.checkedIn) {
    return {
      icon: 'how_to_reg',
      tone: 'checked-in',
      hintKey: value === appointmentStatuses.confirmed
        ? 'appointmentDetailStatusConfirmedHint'
        : 'appointmentDetailStatusCheckedInHint',
    }
  }
  if (value === appointmentStatuses.inProgress) {
    return {
      icon: 'play_circle',
      tone: 'in-progress',
      hintKey: 'appointmentDetailStatusInProgressHint',
    }
  }
  if (value === appointmentStatuses.completed) {
    return {
      icon: 'task_alt',
      tone: 'completed',
      hintKey: 'appointmentDetailStatusCompletedHint',
    }
  }
  if (value === appointmentStatuses.cancelled) {
    return {
      icon: 'cancel',
      tone: 'cancelled',
      hintKey: 'appointmentDetailStatusCancelledHint',
    }
  }
  if (value === appointmentStatuses.noShow) {
    return {
      icon: 'person_off',
      tone: 'no-show',
      hintKey: 'appointmentDetailStatusNoShowHint',
    }
  }
  if (value === appointmentStatuses.pending) {
    return {
      icon: 'schedule',
      tone: 'pending',
      hintKey: 'appointmentDetailStatusPendingHint',
    }
  }
  if (value === appointmentStatuses.rescheduled) {
    return {
      icon: 'update',
      tone: 'rescheduled',
      hintKey: 'appointmentDetailStatusRescheduledHint',
    }
  }

  return {
    icon: 'event_available',
    tone: 'scheduled',
    hintKey: 'appointmentDetailStatusScheduledHint',
  }
}

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

async function onJoinStaffTelehealth() {
  const sessionId = telehealthSessionId.value
  if (!sessionId) {
    $q.notify({
      type: 'warning',
      message: t('telehealthSessionPending'),
    })

    return
  }
  open.value = false
  await router.push({
    name: 'TelehealthSession',
    params: { sessionId: String(sessionId) },
    query: { role: telehealthRoles.clinician },
  })
}

async function onCopyInvite() {
  await copyTelehealthInviteUrl(telehealthInviteUrl.value, $q, t)
}

function copyAppointmentNumber() {
  const value = detailRecord.value?.appointmentNumber
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
  const record = detailRecord.value
  const id = clientChartKey({
    id: record?.clientId,
    clientNumber: record?.clientNumber,
  })
  if (!id) {
    return
  }

  open.value = false
  void router.push({ path: `/clients/${id}` })
}

function onEncounter() {
  if (hasActiveEncounter.value) {
    const id = activeEncounterId.value
      ?? detailRecord.value?.encounterId
    open.value = false
    if (id != null) {
      void router.push({
        name: 'EncounterWorkspace',
        params: { id: String(id) },
      })

      return
    }
  }
  encounterDialogOpen.value = true
}

async function onEncounterSubmit(form) {
  try {
    const payload = await buildQuickStartEncounterPayload({
      encounterType: form?.encounterType,
      appointmentId: form?.appointmentId ?? appointmentId.value,
      staffMember: linkedStaffProfile.value,
      clinicName: authStore.activeSubtenant?.name,
    })
    if (!payload || payload.error) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t(payload?.error || 'activeEncounterActionError'),
      })

      return
    }
    const encounter = await startEncounter({
      ...payload,
      ...form,
    })
    encounterDialogOpen.value = false
    open.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('startEncounterSuccess'),
    })
    if (encounter?.id != null) {
      await router.push({
        name: 'EncounterWorkspace',
        params: { id: String(encounter.id) },
      })
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('activeEncounterActionError'),
      })
    }
  }
}
</script>
