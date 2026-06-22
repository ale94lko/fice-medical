<template>
  <section
    class="client-overview-header"
    :data-testid="clientOverviewTestIds.header">
    <div class="client-overview-header__layout">
      <div class="client-overview-header__main">
        <div class="client-overview-header__profile-head">
          <div class="client-overview-header__avatar-wrap">
            <div
              class="client-overview-header__avatar"
              :style="clientAvatarStyle">
              {{ header.clientInitials }}
            </div>
            <span
              v-if="header.statusLabel"
              class="client-overview-header__status-badge">
              {{ header.statusLabel }}
            </span>
          </div>

          <div class="client-overview-header__profile-body">
            <h2 class="client-overview-header__name">
              {{ header.fullName }}
            </h2>

            <div class="client-overview-header__meta-row">
              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('clientNumber') }}
                </span>
                <div class="client-overview-header__meta-value-row">
                  <strong
                    v-if="header.clientNumber"
                    class="client-overview-header__meta-value
                      client-overview-header__client-number-badge">
                    {{ header.clientNumber }}
                  </strong>
                  <strong
                    v-else
                    class="client-overview-header__meta-value">
                    —
                  </strong>
                  <q-btn
                    v-if="header.clientNumber"
                    flat
                    dense
                    round
                    size="xs"
                    icon="content_copy"
                    class="client-overview-header__copy-btn"
                    :aria-label="t('clientOverviewCopyClientNumber')"
                    @click="copyClientNumber"
                  />
                  <q-btn
                    no-caps
                    unelevated
                    dense
                    outline
                    color="primary"
                    class="app-btn-outline
                      client-overview-header__edit-btn"
                    icon="edit"
                    size="sm"
                    :data-testid="clientOverviewTestIds.edit"
                    :disable="loading"
                    :label="t('editClient')"
                    @click="emit('edit')"
                  />
                </div>
              </div>

              <div
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('clientOverviewDobAge') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.dobAgeLine }}
                </strong>
              </div>

              <div
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('clientOverviewSex') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.gender }}
                </strong>
              </div>
            </div>

            <div
              v-if="header.phones.length || header.emails.length"
              class="client-overview-header__contact-row">
              <div
                v-if="header.phones.length"
                class="client-overview-header__contact-group">
                <q-icon name="phone" size="18px" />
                <AdminTableContactOverflow
                  :entries="header.phones"
                  icon="phone"
                  variant="header"
                  type-before-value
                />
              </div>
              <div
                v-if="header.emails.length"
                class="client-overview-header__contact-group">
                <q-icon name="mail_outline" size="18px" />
                <AdminTableContactOverflow
                  :entries="header.emails"
                  icon="mail_outline"
                  variant="header"
                  type-before-value
                />
              </div>
            </div>

            <div class="client-overview-header__demographics-row">
              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('race') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.race }}
                </strong>
              </div>

              <div
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('ethnicity') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.ethnicity }}
                </strong>
              </div>

              <div
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('clientOverviewPreferredLanguage') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.preferredLanguage || '—' }}
                </strong>
              </div>

              <div
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('clientOverviewSsnLast4') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.idNumberMasked }}
                </strong>
              </div>

              <q-btn
                v-if="missingItems.length"
                flat
                round
                dense
                color="warning"
                class="client-overview-header__missing-alert-btn"
                icon="warning_amber"
                :data-testid="clientOverviewTestIds.reviewMissing"
                :aria-label="t('clientOverviewReviewMissing')"
                @click="emit('review-missing')">
                <q-tooltip anchor="bottom middle" self="top middle">
                  {{ t('clientOverviewMissingInformation', {
                    count: missingItems.length,
                  }) }}
                </q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </div>

      <div class="client-overview-header__aside-grid">
        <div
          class="client-overview-header__aside-cell
            client-overview-header__aside-cell--r1-c1
            client-overview-header__aside-cell--clinicians">
          <q-icon name="person_outline" size="20px" />
          <div class="client-overview-header__meta-cell">
            <span class="client-overview-header__meta-label">
              {{ t('assignedClinician') }}
            </span>
            <AdminTableClinicianAvatars
              v-if="header.clinicians.length"
              :entries="header.clinicians"
              size="md"
            />
            <p
              v-else
              class="client-overview-header__aside-value">
              —
            </p>
          </div>
        </div>

        <div
          class="client-overview-header__aside-cell
            client-overview-header__aside-cell--r1-c2">
          <q-icon name="o_health_and_safety" size="20px" />
          <div class="client-overview-header__meta-cell">
            <span class="client-overview-header__meta-label">
              {{ t('clientOverviewPrimaryInsurance') }}
            </span>
            <p class="client-overview-header__aside-value">
              {{ insurance.payerName }}
            </p>
          </div>
        </div>

        <div
          class="client-overview-header__aside-cell
            client-overview-header__aside-cell--r1-c3">
          <q-icon name="attach_money" size="20px" />
          <div class="client-overview-header__meta-cell">
            <span class="client-overview-header__meta-label">
              {{ t('clientOverviewCurrentBalance') }}
            </span>
            <p
              class="client-overview-header__aside-value
                client-overview-header__aside-value--balance">
              {{ billing.balance }}
            </p>
          </div>
        </div>

        <div
          class="client-overview-header__aside-cell
            client-overview-header__aside-cell--r2-c1">
          <q-icon name="event" size="20px" />
          <div class="client-overview-header__meta-cell">
            <span class="client-overview-header__meta-label">
              {{ t('clientOverviewLastVisit') }}
            </span>
            <p class="client-overview-header__aside-value">
              {{ header.lastVisit?.date || '—' }}
            </p>
          </div>
        </div>

        <div
          class="client-overview-header__aside-cell
            client-overview-header__aside-cell--r2-c2">
          <q-icon name="o_badge" size="20px" />
          <div class="client-overview-header__meta-cell">
            <span class="client-overview-header__meta-label">
              {{ t('clientOverviewMemberId') }}
            </span>
            <p class="client-overview-header__aside-value">
              {{ insurance.memberId }}
            </p>
          </div>
        </div>

        <div
          class="client-overview-header__aside-cell
            client-overview-header__aside-cell--r2-c3">
          <q-icon name="receipt_long" size="20px" />
          <div class="client-overview-header__meta-cell">
            <span class="client-overview-header__meta-label">
              {{ t('clientOverviewLastStatement') }}
            </span>
            <p class="client-overview-header__aside-value">
              {{ billing.lastStatement }}
            </p>
          </div>
        </div>

        <div
          class="client-overview-header__aside-cell
            client-overview-header__aside-cell--r3-c1">
          <q-icon name="event_available" size="20px" />
          <div class="client-overview-header__meta-cell">
            <span class="client-overview-header__meta-label">
              {{ t('clientOverviewNextAppointment') }}
            </span>
            <p class="client-overview-header__aside-value">
              {{ header.nextAppointment?.dateTimeLine || '—' }}
            </p>
          </div>
        </div>

        <div
          class="client-overview-header__aside-cell
            client-overview-header__aside-cell--r3-c2">
          <q-icon name="o_verified_user" size="20px" />
          <div class="client-overview-header__meta-cell">
            <span class="client-overview-header__meta-label">
              {{ t('status') }}
            </span>
            <p class="client-overview-header__aside-value">
              {{ insurance.status || '—' }}
            </p>
          </div>
        </div>

        <div
          class="client-overview-header__aside-cell
            client-overview-header__aside-cell--r3-c3">
          <q-icon name="payments" size="20px" />
          <div class="client-overview-header__meta-cell">
            <span class="client-overview-header__meta-label">
              {{ t('clientOverviewPaymentStatus') }}
            </span>
            <p class="client-overview-header__aside-value">
              {{ billing.paymentStatus }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar, copyToClipboard } from 'quasar'
import { quasarNotifyTypes } from 'components/constants.js'
import AdminTableClinicianAvatars from
  'components/admin-table/AdminTableClinicianAvatars.vue'
import AdminTableContactOverflow from
  'components/admin-table/AdminTableContactOverflow.vue'
import { clinicianAvatarStyle } from 'src/utils/clinician-display.js'
import { clientOverviewTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  header: {
    type: Object,
    required: true,
  },
  billing: {
    type: Object,
    required: true,
  },
  insurance: {
    type: Object,
    required: true,
  },
  missingItems: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['review-missing', 'edit'])

const { t } = useI18n()
const $q = useQuasar()

const clientAvatarStyle = computed(() =>
  clinicianAvatarStyle(props.header.fullName),
)

function copyClientNumber() {
  copyToClipboard(props.header.clientNumber)
    .then(() => {
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('clientOverviewCopiedClientNumber'),
        position: 'top',
      })
    })
    .catch(() => {})
}
</script>
