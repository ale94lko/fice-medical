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
                {{ t('claimTitle', {
                  number: detail.claimNumber || detail.id,
                }) }}
              </h1>
              <AdminTableStatusCell
                :label="statusLabel(detail.status)"
                :variant="detail.statusVariant"
              />
              <span
                v-if="detail.blockingCount > 0"
                class="billing-queue-readiness
                  billing-queue-readiness--blockers">
                {{ t('claimQueueBlockers', {
                  count: detail.blockingCount,
                }) }}
              </span>
            </div>
            <p class="superbill-detail__subtitle q-mb-none">
              {{ headerClientLine }}
            </p>
            <p class="text-caption text-grey-7 q-mb-none">
              {{ headerMetaLine }}
            </p>
          </div>
          <div class="superbill-detail__actions no-print">
            <q-btn
              v-if="detail.superbillId"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid.viewSuperbill"
              :label="t('claimViewSuperbill')"
              @click="goToSuperbill"
            />
            <q-btn
              v-if="canVoid"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid.void"
              :label="t('claimVoid')"
              @click="voidOpen = true"
            />
          </div>
        </div>
      </div>

      <nav class="superbill-detail__tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="superbill-detail__tab"
          :class="{
            'superbill-detail__tab--active': activeTab === tab.key,
          }"
          :data-testid="tid.tab(tab.key)"
          @click="activeTab = tab.key">
          {{ tab.label }}
        </button>
      </nav>

      <div
        v-if="activeTab === 'overview'"
        class="superbill-detail__layout">
        <div class="superbill-detail__main">
          <section class="superbill-detail__card">
            <h2>{{ t('claimReadiness') }}</h2>
            <div
              v-if="detail.isReady"
              class="superbill-detail__ready">
              <q-icon name="check_circle" color="positive" size="22px" />
              <div>
                <strong>{{ t('claimReadinessReadyTitle') }}</strong>
                <p class="text-body2 text-grey-7 q-mb-none">
                  {{ t('claimReadinessReadyBody') }}
                </p>
              </div>
            </div>
            <div
              v-else-if="detail.isVoided"
              class="superbill-detail__alert">
              {{ t('claimReadinessVoided') }}
            </div>
            <div
              v-else-if="blockingChecks.length"
              class="superbill-detail__alert">
              {{ t('claimReadinessAlert', {
                count: blockingChecks.length,
              }) }}
            </div>
            <div
              v-for="group in groupedChecks"
              :key="group.category"
              class="q-mt-md">
              <h3 class="text-subtitle2 q-mb-sm">
                {{ categoryLabel(group.category) }}
              </h3>
              <ul class="superbill-detail__checks">
                <li
                  v-for="check in group.checks"
                  :key="checkKey(check)"
                  class="superbill-detail__check">
                  <q-icon
                    :name="checkIcon(check)"
                    :color="checkColor(check)"
                    size="20px"
                  />
                  <div class="superbill-detail__check-body">
                    <strong>{{ checkTitle(check) }}</strong>
                    <p
                      v-if="check.message && !check.passed"
                      class="text-body2 text-grey-7 q-mb-none">
                      {{ check.message }}
                    </p>
                    <p
                      v-else-if="check.summary && check.passed"
                      class="text-body2 text-grey-7 q-mb-none">
                      {{ check.summary }}
                    </p>
                  </div>
                  <q-btn
                    v-if="check.action && !check.passed"
                    no-caps
                    outline
                    dense
                    color="primary"
                    class="app-btn-outline"
                    :data-testid="tid.requirementAction(
                      check.code,
                      check.claimLineId,
                    )"
                    :label="actionLabel(check)"
                    @click="onRequirementAction(check)"
                  />
                </li>
              </ul>
            </div>
          </section>
        </div>
        <aside class="superbill-detail__side">
          <section class="superbill-detail__card">
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('claimMetaClient') }}</dt>
                <dd>{{ headerClientLine }}</dd>
              </div>
              <div>
                <dt>{{ t('claimMetaDos') }}</dt>
                <dd>{{ detail.dateOfServiceDisplay || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimMetaPayer') }}</dt>
                <dd>{{ detail.insurance?.payerName || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimMetaTotal') }}</dt>
                <dd>{{ detail.totalChargeLabel || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimSourceSuperbill') }}</dt>
                <dd>{{ detail.superbillNumber || '—' }}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <section
        v-else-if="activeTab === 'patient'"
        class="superbill-detail__card">
        <h2>{{ t('claimTabPatient') }}</h2>
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <h3 class="text-subtitle2">{{ t('claimPatient') }}</h3>
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('claimName') }}</dt>
                <dd>{{ detail.patient?.fullName || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimDob') }}</dt>
                <dd>{{ detail.patient?.dobDisplay || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimSex') }}</dt>
                <dd>{{ detail.patient?.sex || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimAddress') }}</dt>
                <dd>{{ patientAddress }}</dd>
              </div>
            </dl>
          </div>
          <div class="col-12 col-md-6">
            <h3 class="text-subtitle2">{{ t('claimSubscriber') }}</h3>
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('claimName') }}</dt>
                <dd>{{ detail.subscriber?.fullName || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimRelationship') }}</dt>
                <dd>{{ detail.subscriber?.relationship || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimMemberId') }}</dt>
                <dd>{{ detail.subscriber?.memberIdMasked || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimInsurance') }}</dt>
                <dd>{{ detail.insurance?.payerName || '—' }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section
        v-else-if="activeTab === 'services'"
        class="superbill-detail__card">
        <h2>{{ t('claimTabServices') }}</h2>
        <div class="superbill-detail__table-wrap">
          <table class="superbill-detail__table">
            <thead>
              <tr>
                <th>{{ t('claimCpt') }}</th>
                <th>{{ t('claimService') }}</th>
                <th>{{ t('claimUnits') }}</th>
                <th>{{ t('claimPos') }}</th>
                <th>{{ t('claimCharge') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!detail.lines.length">
                <td colspan="5" class="text-grey-7">
                  {{ t('claimServicesEmpty') }}
                </td>
              </tr>
              <tr
                v-for="line in detail.lines"
                :key="line.id">
                <td>{{ line.procedureCode || '—' }}</td>
                <td>
                  <div>{{ line.serviceName || '—' }}</div>
                  <div class="text-caption text-grey-7">
                    {{ lineDetail(line) }}
                  </div>
                </td>
                <td>{{ line.units ?? '—' }}</td>
                <td>{{ line.placeOfServiceCode || '—' }}</td>
                <td>{{ line.chargeAmountLabel || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        v-else-if="activeTab === 'diagnoses'"
        class="superbill-detail__card">
        <h2>{{ t('claimTabDiagnoses') }}</h2>
        <ol class="q-pl-lg">
          <li
            v-for="dx in detail.diagnoses"
            :key="dx.id">
            <strong>{{ dx.diagnosisCode }}</strong>
            <span v-if="dx.primary" class="q-ml-sm text-caption">
              {{ t('claimPrimaryDiagnosis') }}
            </span>
            <div class="text-body2 text-grey-7">
              {{ dx.diagnosisDescription || '—' }}
            </div>
          </li>
        </ol>
        <p
          v-if="!detail.diagnoses.length"
          class="text-grey-7">
          {{ t('claimDiagnosesEmpty') }}
        </p>
        <h3 class="text-subtitle2 q-mt-lg">
          {{ t('claimServiceMapping') }}
        </h3>
        <ul>
          <li
            v-for="line in detail.lines"
            :key="`map-${line.id}`">
            {{ line.procedureCode || line.serviceName }}
            →
            {{ line.diagnosisPointers.join(', ') || '—' }}
          </li>
        </ul>
      </section>

      <section
        v-else-if="activeTab === 'providers'"
        class="superbill-detail__card">
        <h2>{{ t('claimTabProviders') }}</h2>
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <h3 class="text-subtitle2">
              {{ t('claimBillingProvider') }}
            </h3>
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('claimName') }}</dt>
                <dd>{{ detail.billingProvider?.name || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimNpi') }}</dt>
                <dd>{{ detail.billingProvider?.npi || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimTaxonomy') }}</dt>
                <dd>{{ detail.billingProvider?.taxonomy || '—' }}</dd>
              </div>
            </dl>
          </div>
          <div class="col-12 col-md-6">
            <h3 class="text-subtitle2">
              {{ t('claimRenderingProvider') }}
            </h3>
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('claimName') }}</dt>
                <dd>{{ detail.renderingProvider?.name || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimNpi') }}</dt>
                <dd>{{ detail.renderingProvider?.npi || '—' }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section
        v-else-if="activeTab === 'information'"
        class="superbill-detail__card">
        <h2>{{ t('claimTabInformation') }}</h2>
        <dl class="superbill-detail__facts">
          <div>
            <dt>{{ t('claimType') }}</dt>
            <dd>{{ t('claimTypeProfessional') }}</dd>
          </div>
          <div>
            <dt>{{ t('claimSourceSuperbill') }}</dt>
            <dd>{{ detail.superbillNumber || '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('claimSourceVersion') }}</dt>
            <dd>{{ detail.sourceSuperbillVersion ?? '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('claimCreatedAt') }}</dt>
            <dd>{{ formatWhen(detail.createdAt) }}</dd>
          </div>
          <div>
            <dt>{{ t('claimColumnStatus') }}</dt>
            <dd>{{ statusLabel(detail.status) }}</dd>
          </div>
        </dl>
      </section>

      <section
        v-else
        class="superbill-detail__card">
        <h2>{{ t('claimTabHistory') }}</h2>
        <ul class="superbill-detail__history">
          <li
            v-for="item in historyItems"
            :key="item.id || item.createdAt">
            <strong>{{ historyActionLabel(item.action) }}</strong>
            <span>
              {{ formatWhen(item.createdAt) }}
              <template v-if="item.changedByName">
                · {{ item.changedByName }}
              </template>
              <template v-if="item.reason">
                — {{ item.reason }}
              </template>
            </span>
          </li>
          <li
            v-if="!historyItems.length"
            class="text-grey-7">
            {{ t('claimHistoryEmpty') }}
          </li>
        </ul>
      </section>
    </template>

    <div
      v-else-if="!loading"
      class="superbill-detail__empty">
      {{ loadError || t('claimLoadError') }}
    </div>

    <ClaimVoidDialog
      v-model="voidOpen"
      :submitting="actionBusy"
      @confirm="onVoid"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  claimRequirementActions,
  claimStatuses,
  quasarNotifyTypes,
} from 'components/constants.js'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ClaimVoidDialog from
  'components/claims/ClaimVoidDialog.vue'
import { useClaimPermissions } from
  'src/composables/useClaimPermissions.js'
import { useSyncAppPageTitle } from
  'src/composables/useAppPageTitle.js'
import { claimDetailTestIds as tid } from
  'src/test-ids/index.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { clientChartKey } from 'components/helpers.js'
import {
  claimApiErrorMessage,
  fetchClaimById,
  fetchClaimHistory,
  voidClaim,
} from 'src/utils/claim-api.js'
import { claimRequirementActionLabelKey }
  from 'src/utils/claim-normalize.js'

const { t, te } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const { canVoidClaim } = useClaimPermissions()

useSyncAppPageTitle(computed(() => t('claimWorkspaceTitle')))

const loading = ref(false)
const actionBusy = ref(false)
const detail = ref(null)
const loadError = ref('')
const activeTab = ref('overview')
const voidOpen = ref(false)
const historyItems = ref([])

const claimId = computed(() =>
  String(route.params.id ?? '').trim(),
)

const tabs = computed(() => [
  { key: 'overview', label: t('claimTabOverview') },
  { key: 'patient', label: t('claimTabPatient') },
  { key: 'services', label: t('claimTabServices') },
  { key: 'diagnoses', label: t('claimTabDiagnoses') },
  { key: 'providers', label: t('claimTabProviders') },
  { key: 'information', label: t('claimTabInformation') },
  { key: 'history', label: t('claimTabHistory') },
])

const readinessChecks = computed(() =>
  Array.isArray(detail.value?.claimReadiness?.checks)
    ? detail.value.claimReadiness.checks
    : [],
)

const blockingChecks = computed(() =>
  readinessChecks.value.filter(item =>
    !item.passed && item.severity === 'BLOCKING'),
)

const groupedChecks = computed(() => {
  const order = [
    'PATIENT',
    'SUBSCRIBER',
    'PAYER',
    'PROVIDERS',
    'CLAIM_INFORMATION',
    'SERVICES',
    'DIAGNOSES',
  ]
  const byCategory = new Map()
  for (const check of readinessChecks.value) {
    const key = check.category || 'CLAIM_INFORMATION'
    if (!byCategory.has(key)) {
      byCategory.set(key, [])
    }
    byCategory.get(key).push(check)
  }

  return order
    .filter(category => byCategory.has(category))
    .map(category => ({
      category,
      checks: byCategory.get(category),
    }))
})

const canVoid = computed(() =>
  canVoidClaim.value
  && detail.value?.isVoided !== true,
)

const headerClientLine = computed(() =>
  detail.value?.patient?.fullName || '—',
)

const headerMetaLine = computed(() => {
  const bits = [
    detail.value?.dateOfServiceDisplay,
    detail.value?.insurance?.payerName,
    detail.value?.totalChargeLabel,
  ].filter(Boolean)

  return bits.join(' · ')
})

const patientAddress = computed(() => {
  const patient = detail.value?.patient || {}
  const line = [
    patient.addressLine1,
    patient.addressLine2,
    [patient.city, patient.state, patient.postalCode]
      .filter(Boolean).join(', '),
  ].filter(Boolean).join(', ')

  return line || '—'
})

function statusLabel(status) {
  if (status === claimStatuses.ready) {
    return t('claimStatusReady')
  }
  if (status === claimStatuses.voided) {
    return t('claimStatusVoided')
  }

  return t('claimStatusDraft')
}

function categoryLabel(category) {
  const map = {
    PATIENT: 'claimCategoryPatient',
    SUBSCRIBER: 'claimCategorySubscriber',
    PAYER: 'claimCategoryPayer',
    PROVIDERS: 'claimCategoryProviders',
    CLAIM_INFORMATION: 'claimCategoryInformation',
    SERVICES: 'claimCategoryServices',
    DIAGNOSES: 'claimCategoryDiagnoses',
  }
  const key = map[category]

  return key ? t(key) : category
}

function checkTitle(check) {
  return check.title || check.code
}

function checkKey(check) {
  return [
    check.code,
    check.claimLineId,
    check.message,
  ].filter(Boolean).join('-')
}

function checkIcon(check) {
  if (check.passed) {
    return 'check_circle'
  }
  if (check.severity === 'WARNING') {
    return 'error_outline'
  }

  return 'error'
}

function checkColor(check) {
  if (check.passed) {
    return 'positive'
  }
  if (check.severity === 'WARNING') {
    return 'warning'
  }

  return 'negative'
}

function actionLabel(check) {
  if (check?.actionLabel) {
    return check.actionLabel
  }
  const key = claimRequirementActionLabelKey(check.action)
  if (key && te(key)) {
    return t(key)
  }

  return t('claimViewSource')
}

function lineDetail(line) {
  const bits = []
  if (line.diagnosisPointers?.length) {
    bits.push(t('claimDiagnosisPointers', {
      pointers: line.diagnosisPointers.join(', '),
    }))
  }
  if (line.modifiers?.length) {
    bits.push(t('claimModifiers', {
      modifiers: line.modifiers.join(', '),
    }))
  }

  return bits.join(' · ')
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

function historyActionLabel(action) {
  const map = {
    CLAIM_CREATED: 'claimHistoryCreated',
    CLAIM_STATUS_CHANGED: 'claimHistoryStatusChanged',
    CLAIM_READY: 'claimHistoryReady',
    CLAIM_VOIDED: 'claimHistoryVoided',
    CLAIM_READINESS_CHANGED: 'claimHistoryReadinessChanged',
  }
  const key = map[action]

  return key && te(key) ? t(key) : action
}

function goToSuperbill() {
  if (!detail.value?.superbillId) {
    return
  }
  void router.push({
    name: 'SuperbillDetail',
    params: { id: String(detail.value.superbillId) },
  })
}

function goToClient() {
  const id = clientChartKey(detail.value?.patient)
  if (!id) {
    return
  }
  void router.push({
    name: 'EditClient',
    params: { id },
  })
}

function goToClientInsurance() {
  const id = clientChartKey(detail.value?.patient)
  if (!id) {
    return
  }
  void router.push({
    name: 'EditClient',
    params: { id },
    query: { tab: 'insurance' },
  })
}

function goToProvider(sourceId) {
  if (!sourceId) {
    return
  }
  void router.push({
    name: 'StaffProfile',
    params: { id: String(sourceId) },
  })
}

function onRequirementAction(check) {
  if (check.action === claimRequirementActions.viewInsurance) {
    goToClientInsurance()
    return
  }
  if (check.action === claimRequirementActions.viewClient) {
    goToClient()
    return
  }
  if (check.action === claimRequirementActions.viewProvider) {
    goToProvider(check.sourceId)
    return
  }
  goToSuperbill()
}

async function loadDetail() {
  if (!claimId.value) {
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    detail.value = await fetchClaimById(claimId.value)
    const history = await fetchClaimHistory(claimId.value)
    historyItems.value = history.items
  } catch (error) {
    detail.value = null
    historyItems.value = []
    loadError.value = claimApiErrorMessage(
      error,
      t('claimLoadError'),
    )
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: loadError.value,
      })
    }
  } finally {
    loading.value = false
  }
}

async function onVoid({ reason, notes }) {
  actionBusy.value = true
  try {
    detail.value = await voidClaim(claimId.value, {
      reason,
      notes,
      version: detail.value?.version,
    })
    voidOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('claimVoidSuccess'),
    })
    const history = await fetchClaimHistory(claimId.value)
    historyItems.value = history.items
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: claimApiErrorMessage(
          error,
          t('claimVoidError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}

watch(claimId, () => {
  void loadDetail()
})

onMounted(() => {
  void loadDetail()
})
</script>
