<template>
  <q-page
    class="admin-page superbill-detail"
    :data-testid="tid.page">
    <AppLoadingOverlay scope="content" :showing="loading" />

    <template v-if="detail">
      <div class="superbill-detail__top">
        <div class="superbill-detail__title-row">
          <div>
            <div class="row items-center q-gutter-sm">
              <h1 class="superbill-detail__title">
                {{ detail.remittanceNumber }}
              </h1>
              <AdminTableStatusCell
                :label="postingLabel(detail.postingStatus)"
                :variant="paymentPostingVariant(detail.postingStatus)"
              />
            </div>
            <p class="superbill-detail__subtitle q-mb-none">
              {{ detail.payerName || '—' }}
            </p>
          </div>
          <div class="superbill-detail__actions no-print">
            <q-btn
              v-if="canPost"
              no-caps
              unelevated
              color="primary"
              class="app-btn-primary"
              :loading="actionBusy"
              :disable="!canPostNow"
              :data-testid="tid.post"
              :label="t('remittancePost')"
              @click="onPost"
            />
          </div>
        </div>
      </div>

      <section class="superbill-detail__card">
        <h2>{{ t('remittanceOverview') }}</h2>
        <div
          v-if="unmatched.length"
          class="superbill-detail__alert q-mb-md">
          {{ t('remittanceNeedsAttention', {
            count: unmatched.length,
          }) }}
        </div>
        <dl class="superbill-detail__facts">
          <div>
            <dt>{{ t('claimColumnPayer') }}</dt>
            <dd>{{ detail.payerName || '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('remittanceColumnReceived') }}</dt>
            <dd>{{ formatWhen(detail.receivedAt) }}</dd>
          </div>
          <div>
            <dt>{{ t('remittanceColumnPayment') }}</dt>
            <dd>{{ detail.totalPaymentAmountLabel }}</dd>
          </div>
          <div>
            <dt>{{ t('remittanceColumnClaims') }}</dt>
            <dd>{{ detail.claimCount }}</dd>
          </div>
          <div>
            <dt>{{ t('remittanceMatched') }}</dt>
            <dd>{{ detail.matchedClaimCount }}</dd>
          </div>
          <div>
            <dt>{{ t('remittanceNeedsReview') }}</dt>
            <dd>{{ detail.unmatchedClaimCount }}</dd>
          </div>
          <div>
            <dt>{{ t('remittancePostingStatus') }}</dt>
            <dd>{{ postingLabel(detail.postingStatus) }}</dd>
          </div>
        </dl>
      </section>

      <section class="superbill-detail__card q-mt-lg">
        <h2>{{ t('remittanceClaimList') }}</h2>
        <div class="superbill-detail__table-wrap">
          <table class="superbill-detail__table">
            <thead>
              <tr>
                <th>{{ t('claimColumnNumber') }}</th>
                <th>{{ t('claimColumnClient') }}</th>
                <th>{{ t('claimAdjBilled') }}</th>
                <th>{{ t('claimAdjAllowed') }}</th>
                <th>{{ t('claimAdjPaid') }}</th>
                <th>{{ t('claimAdjPatient') }}</th>
                <th>{{ t('claimColumnStatus') }}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in detail.claims"
                :key="row.id">
                <td>{{ row.claimNumber || '—' }}</td>
                <td>{{ row.clientName || '—' }}</td>
                <td>{{ row.billedAmountLabel }}</td>
                <td>{{ row.allowedAmountLabel }}</td>
                <td>{{ row.payerPaidAmountLabel }}</td>
                <td>{{ row.clientResponsibilityAmountLabel }}</td>
                <td>
                  {{ row.adjudicationStatus || row.matchStatus }}
                  <div
                    v-if="row.issueMessage"
                    class="text-caption text-grey-7">
                    {{ row.issueMessage }}
                  </div>
                </td>
                <td>
                  <q-btn
                    v-if="row.claimId"
                    flat
                    dense
                    no-caps
                    color="primary"
                    :data-testid="tid.reviewClaim(row.id)"
                    :label="t('remittanceReview')"
                    @click="openClaim(row.claimId)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  permissionNames,
  quasarNotifyTypes,
} from 'components/constants.js'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { useSyncAppPageTitle } from
  'src/composables/useSyncAppPageTitle.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'
import {
  fetchRemittanceById,
  postRemittance,
  remittanceApiErrorMessage,
} from 'src/utils/remittance-api.js'
import { paymentPostingVariant } from
  'src/utils/remittance-work-queue.js'
import { remittanceDetailTestIds as tid } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

useSyncAppPageTitle(computed(() => t('remittanceWorkspaceTitle')))

const loading = ref(false)
const actionBusy = ref(false)
const detail = ref(null)

const canPost = computed(() => hasPermission(
  authStore.permissions,
  permissionNames.paymentPost,
))
const unmatched = computed(() => (detail.value?.claims || [])
  .filter(row => row.matchStatus !== 'MATCHED'))
const canPostNow = computed(() => {
  const status = detail.value?.postingStatus
  return status === 'UNPOSTED' || status === 'PARTIALLY_POSTED'
})

onMounted(loadDetail)

async function loadDetail() {
  loading.value = true
  try {
    detail.value = await fetchRemittanceById(route.params.id)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: remittanceApiErrorMessage(
          error,
          t('remittanceListLoadError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

function postingLabel(status) {
  if (status === 'POSTED') {
    return t('paymentStatusPosted')
  }
  if (status === 'PARTIALLY_POSTED') {
    return t('paymentStatusInProcess')
  }

  return t('paymentStatusPending')
}

function formatWhen(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return '—'
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return raw
  }

  return date.toLocaleString()
}

function openClaim(id) {
  router.push({ name: 'ClaimDetail', params: { id: String(id) } })
}

async function onPost() {
  if (!detail.value?.id) {
    return
  }
  actionBusy.value = true
  try {
    detail.value = await postRemittance(
      detail.value.id,
      detail.value.version,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('remittancePostSuccess'),
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: remittanceApiErrorMessage(
          error,
          t('remittancePostError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}
</script>
