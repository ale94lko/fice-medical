<template>
  <div
    class="encounter-workspace-follow-up"
    :data-testid="tid.followUp">
    <div class="encounter-workspace-follow-up__grid">
      <section
        v-for="card in cards"
        :key="card.key"
        class="encounter-workspace-card">
        <div class="encounter-workspace-card__head">
          <h2>{{ card.title }}</h2>
          <q-badge outline color="primary">
            {{ card.badge }}
          </q-badge>
        </div>
        <p class="text-body2 text-grey-7">
          {{ card.hint }}
        </p>
        <q-btn
          v-if="card.canOpen"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :disable="saving"
          :label="card.action"
          @click="openCard(card.key)"
        />
      </section>
    </div>

    <AppointmentBookDialog
      v-model="appointmentOpen"
      :client-id="clientKey"
      mode="book"
      :saving="saving"
      @booked="onAppointmentBooked"
      @cancel="appointmentOpen = false"
    />

    <FollowUpEditDialog
      v-model="followUpOpen"
      :record="null"
      mode="add"
      :clinician-options="clinicianOptions"
      :client-id="clientKey"
      :saving="saving"
      @save="onFollowUpSave"
    />

    <ReferralDialog
      v-model="referralOpen"
      mode="add"
      :referral="emptyReferral"
      :clinician-options="clinicianOptions"
      :saving="saving"
      :can-upload-documents="false"
      @save="onReferralSave"
      @cancel="referralOpen = false"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppointmentBookDialog from 'components/AppointmentBookDialog.vue'
import FollowUpEditDialog from 'components/FollowUpEditDialog.vue'
import ReferralDialog from 'components/ReferralDialog.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useClientAppointmentPermissions } from
  'src/composables/useClientAppointmentPermissions.js'
import { useClientFollowUpPermissions } from
  'src/composables/useClientFollowUpPermissions.js'
import { useClientReferralPermissions } from
  'src/composables/useClientReferralPermissions.js'
import { bookAppointment } from 'src/utils/appointment-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  buildFollowUpCreatePayload,
} from 'src/utils/client-follow-ups.js'
import { fetchAllCliniciansSelectOptions } from
  'src/utils/clinicians-api.js'
import {
  apiErrorMessage as referralApiErrorMessage,
  createClientReferral,
} from 'src/utils/referral-api.js'
import { createEmptyReferral } from 'src/utils/referral-orders.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { notifyBookedAppointment } from
  'src/utils/telehealth-appointment-ui.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'

const props = defineProps({
  sections: {
    type: Object,
    default: () => ({}),
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['changed'])

const { t } = useI18n()
const $q = useQuasar()
const siteStore = useSiteStore()
const { canBookAppointment } = useClientAppointmentPermissions()
const { canAddFollowUps } = useClientFollowUpPermissions()
const { canAddReferrals } = useClientReferralPermissions()

const saving = ref(false)
const clinicianOptions = ref([])
const appointmentOpen = ref(false)
const followUpOpen = ref(false)
const referralOpen = ref(false)
const emptyReferral = ref(createEmptyReferral())

const clientKey = computed(() => String(props.clientId ?? '').trim())

const allCards = computed(() => [
  {
    key: 'appointments',
    title: t('encounterFollowUpNextAppointment'),
    badge: t('encounterFollowUpNotScheduled'),
    hint: t('encounterFollowUpNextAppointmentHint'),
    action: t('encounterFollowUpSchedule'),
    canOpen: Boolean(clientKey.value) && canBookAppointment.value,
  },
  {
    key: 'follow-ups',
    title: t('encounterFollowUps'),
    badge: t('encounterFollowUpTotal', {
      count: props.sections?.followUps ?? 0,
    }),
    hint: t('encounterFollowUpsHint'),
    action: t('encounterFollowUpAdd'),
    canOpen: Boolean(clientKey.value) && canAddFollowUps.value,
  },
  {
    key: 'referrals',
    title: t('encounterReferrals'),
    badge: t('encounterFollowUpTotal', {
      count: props.sections?.referrals ?? 0,
    }),
    hint: t('encounterReferralsHint'),
    action: t('encounterReferralAdd'),
    canOpen: Boolean(clientKey.value) && canAddReferrals.value,
  },
])

const cards = computed(() =>
  allCards.value.filter(card => card.canOpen),
)

function notifyError(error, fallbackKey) {
  if (isAuthSessionEndUIError(error)) {
    return
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: referralApiErrorMessage(error, t(fallbackKey)),
    position: 'top',
  })
}

async function loadClinicians() {
  try {
    clinicianOptions.value = await fetchAllCliniciansSelectOptions()
  } catch {
    clinicianOptions.value = []
  }
}

function openCard(key) {
  if (key === 'appointments') {
    appointmentOpen.value = true

    return
  }
  if (key === 'follow-ups') {
    void loadClinicians()
    followUpOpen.value = true

    return
  }
  if (key === 'referrals') {
    void loadClinicians()
    emptyReferral.value = createEmptyReferral()
    referralOpen.value = true
  }
}

async function onAppointmentBooked(body) {
  if (!clientKey.value || saving.value) {
    return
  }
  saving.value = true
  try {
    const result = await bookAppointment(body)
    appointmentOpen.value = false
    const message = result.appointments?.length
      ? t('appointmentBookSeriesSuccess', {
        count: result.appointments.length,
      })
      : t('appointmentBookSuccess')
    notifyBookedAppointment($q, t, result, message)
    emit('changed')
  } catch (error) {
    notifyError(error, 'appointmentBookError')
  } finally {
    saving.value = false
  }
}

async function onFollowUpSave(payload) {
  if (!clientKey.value || saving.value) {
    return
  }
  saving.value = true
  try {
    const createPayload = buildFollowUpCreatePayload(payload)
    await siteStore.patchClientFollowUps(
      clientKey.value,
      [createPayload],
      t,
    )
    followUpOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('followUpPendingAdded'),
      position: 'top',
    })
    emit('changed')
  } catch (error) {
    notifyError(error, 'followUpCreateError')
  } finally {
    saving.value = false
  }
}

async function onReferralSave(referral) {
  if (!clientKey.value || saving.value) {
    return
  }
  saving.value = true
  try {
    await createClientReferral(clientKey.value, referral)
    referralOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('referralSaveSuccess'),
      position: 'top',
    })
    emit('changed')
  } catch (error) {
    notifyError(error, 'referralSaveError')
  } finally {
    saving.value = false
  }
}

watch(
  () => props.clientId,
  () => {
    clinicianOptions.value = []
  },
)
</script>
