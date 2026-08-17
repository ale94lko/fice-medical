<template>
  <div class="telehealth-waiting telehealth-waiting--with-preview">
    <div class="telehealth-card telehealth-waiting__card">
      <div class="telehealth-waiting__layout">
        <div class="telehealth-waiting__preview-col">
          <TelehealthSelfPreview :stream="localStream" />
        </div>

        <div class="telehealth-waiting__controls">
          <h2>{{ t('telehealthWaitingClinicianTitle') }}</h2>
          <p>{{ t('telehealthWaitingClinicianBody') }}</p>

          <TelehealthDeviceToggles
            class="q-mb-md"
            :camera-enabled="cameraEnabled"
            :mic-enabled="micEnabled"
            :speaker-enabled="speakerEnabled"
            :disable="loading"
            @toggle-camera="$emit('toggle-camera')"
            @toggle-mic="$emit('toggle-mic')"
            @toggle-speaker="$emit('toggle-speaker')"
          />

          <div
            v-if="clientInviteUrl"
            class="q-mb-md">
            <p class="q-mb-sm">
              {{ t('telehealthClientInviteLabel') }}
            </p>
            <div class="row no-wrap q-gutter-xs items-center">
              <q-btn
                flat
                dense
                round
                color="primary"
                icon="content_copy"
                :data-testid="telehealthTestIds.waitingCopyInvite"
                :aria-label="t('telehealthCopy')"
                @click="$emit('copy-invite')">
                <q-tooltip>{{ t('telehealthCopy') }}</q-tooltip>
              </q-btn>
              <q-input
                :model-value="clientInviteUrl"
                dense
                outlined
                dark
                readonly
                class="col"
              />
            </div>
            <TelehealthResendInviteFields
              class="q-mt-sm"
              :invite-email="inviteEmail"
              :use-custom-email="useCustomInviteEmail"
              :loading="inviteLoading"
              @update:invite-email="
                $emit('update:inviteEmail', $event)
              "
              @update:use-custom-email="
                $emit('update:useCustomInviteEmail', $event)
              "
              @resend="$emit('resend-invite')"
            />
          </div>

          <div
            v-if="waitingParticipants.length"
            class="q-mb-md">
            <div
              v-for="participant in waitingParticipants"
              :key="participant.id"
              class="telehealth-participant-row">
              <div>
                <div>
                  {{ participant.displayName || t('telehealthChatUnknown') }}
                </div>
                <div
                  class="text-caption"
                  style="opacity: 0.7">
                  {{ roleLabel(participant.role) }}
                  · {{ statusLabel(participant.status) }}
                  <span v-if="participant.ready">
                    · {{ t('telehealthReadyBadge') }}
                  </span>
                </div>
              </div>
              <q-btn
                v-if="canAdmit"
                no-caps
                unelevated
                color="primary"
                :data-testid="telehealthTestIds.admit(participant.id)"
                :label="t('telehealthAdmit')"
                :loading="loading"
                @click="$emit('admit', participant.id)"
              />
            </div>
          </div>
          <p
            v-else
            class="q-mb-md"
            style="opacity: 0.75">
            {{ t('telehealthWaitingEmpty') }}
          </p>

          <div class="telehealth-waiting__actions">
            <q-btn
              v-if="canStart"
              no-caps
              unelevated
              color="primary"
              size="lg"
              class="telehealth-waiting__start-btn full-width"
              :data-testid="telehealthTestIds.waitingStart"
              :label="t('telehealthStart')"
              :loading="loading"
              @click="$emit('start')"
            />
            <q-btn
              no-caps
              unelevated
              color="negative"
              size="lg"
              class="telehealth-waiting__leave-btn full-width"
              :data-testid="telehealthTestIds.waitingLeave"
              :label="t('telehealthLeave')"
              @click="$emit('leave')"
            />
          </div>
          <p
            v-if="error"
            class="text-negative q-mt-md q-mb-none">
            {{ error }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import TelehealthSelfPreview from
  'components/telehealth/TelehealthSelfPreview.vue'
import TelehealthDeviceToggles from
  'components/telehealth/TelehealthDeviceToggles.vue'
import TelehealthResendInviteFields from
  'components/telehealth/TelehealthResendInviteFields.vue'
import { telehealthTestIds } from 'src/test-ids/index.js'
import {
  telehealthParticipantStatusLabel,
  telehealthRoleLabel,
} from 'src/utils/telehealth-normalize.js'

defineProps({
  localStream: { type: Object, default: null },
  cameraEnabled: { type: Boolean, default: true },
  micEnabled: { type: Boolean, default: true },
  speakerEnabled: { type: Boolean, default: true },
  waitingParticipants: { type: Array, default: () => [] },
  clientInviteUrl: { type: String, default: '' },
  inviteEmail: { type: String, default: '' },
  useCustomInviteEmail: { type: Boolean, default: false },
  inviteLoading: { type: Boolean, default: false },
  canAdmit: { type: Boolean, default: false },
  canStart: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits([
  'admit',
  'start',
  'leave',
  'copy-invite',
  'resend-invite',
  'update:inviteEmail',
  'update:useCustomInviteEmail',
  'toggle-camera',
  'toggle-mic',
  'toggle-speaker',
])
const { t } = useI18n()

function roleLabel(role) {
  return telehealthRoleLabel(role, t)
}

function statusLabel(status) {
  return telehealthParticipantStatusLabel(status, t)
}
</script>
