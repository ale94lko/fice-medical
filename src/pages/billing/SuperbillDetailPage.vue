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
                {{ t('superbillTitle', {
                  number: detail.superbillNumber || detail.id,
                }) }}
              </h1>
              <AdminTableStatusCell
                :label="statusLabel(detail.status)"
                :variant="detail.statusVariant"
              />
              <span
                v-if="detail.onHold"
                class="billing-queue-readiness
                  billing-queue-readiness--hold">
                {{ t('billingQueueOnHold') }}
              </span>
              <span
                v-else-if="detail.blockingCount > 0"
                class="billing-queue-readiness
                  billing-queue-readiness--blockers">
                {{ t('billingQueueBlockers', {
                  count: detail.blockingCount,
                }) }}
              </span>
            </div>
            <p class="superbill-detail__subtitle q-mb-none">
              {{ headerClientLine }}
            </p>
            <p class="text-caption text-grey-7 q-mb-none">
              {{ headerIdsLine }}
            </p>
          </div>
          <div class="superbill-detail__actions no-print">
            <q-btn
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid.viewEncounter"
              :label="t('superbillViewEncounter')"
              @click="goToEncounter()"
            />
            <q-btn
              v-if="detail.activeClaim?.id && canViewClaims"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid.viewClaim"
              :label="t('superbillViewClaim')"
              @click="goToClaim"
            />
            <q-btn
              v-else-if="canGenerateClaimFromSuperbill"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :loading="actionBusy"
              :data-testid="tid.generateClaim"
              :label="t('superbillGenerateClaim')"
              @click="onGenerateClaim"
            />
            <q-btn
              v-if="canPutOnHold"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid.hold"
              :label="t('superbillPutOnHold')"
              @click="holdOpen = true"
            />
            <q-btn
              v-if="canReleaseActiveHold"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :loading="actionBusy"
              :data-testid="tid.releaseHold"
              :label="t('superbillReleaseHold')"
              @click="onReleaseHold"
            />
            <q-btn
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="print"
              :data-testid="tid.print"
              :label="t('superbillPrint')"
              @click="onPrint"
            />
            <q-btn
              v-if="showActionsMenu"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid.actions"
              :label="t('superbillActions')">
              <q-menu class="app-light-menu">
                <q-list dense>
                  <q-item
                    v-if="canReopen"
                    v-close-popup
                    clickable
                    :data-testid="tid.reopen"
                    @click="reopenOpen = true">
                    <q-item-section>
                      {{ t('superbillReopen') }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-if="canVoid"
                    v-close-popup
                    clickable
                    :data-testid="tid.void"
                    @click="voidOpen = true">
                    <q-item-section>
                      {{ t('superbillVoid') }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            <div
              v-if="showMarkReviewed"
              class="superbill-detail__review-wrap">
              <q-btn
                no-caps
                unelevated
                color="primary"
                class="app-btn-primary"
                icon="check"
                :disable="!markReviewedEnabled"
                :loading="actionBusy"
                :data-testid="tid.markReviewed"
                :label="t('superbillMarkReviewed')"
                @click="onMarkReviewed"
              />
              <p
                v-if="!markReviewedEnabled"
                class="text-caption text-grey-7 q-mb-none">
                {{ reviewHint }}
              </p>
            </div>
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
            <h2>{{ t('superbillReadiness') }}</h2>
            <div
              v-if="detail.isReviewed"
              class="superbill-detail__ready">
              <q-icon name="check_circle" color="positive" size="22px" />
              <div>
                <strong>{{ t('superbillStatusReviewed') }}</strong>
                <p class="text-body2 text-grey-7 q-mb-none">
                  {{ reviewedMeta }}
                </p>
              </div>
            </div>
            <div
              v-else-if="blockingChecks.length"
              class="superbill-detail__alert">
              {{ t('superbillReadinessAlert', {
                count: blockingChecks.length,
              }) }}
            </div>
            <div
              v-else-if="detail.status === readyStatus"
              class="superbill-detail__ready">
              <q-icon name="check_circle" color="positive" size="22px" />
              <div>
                <strong>{{ t('superbillReadinessReadyTitle') }}</strong>
                <p class="text-body2 text-grey-7 q-mb-none">
                  {{ t('superbillReadinessReadyBody') }}
                </p>
              </div>
            </div>
            <ul class="superbill-detail__checks">
              <li
                v-for="check in readinessChecks"
                :key="checkKey(check)"
                class="superbill-detail__check">
                <q-icon
                  :name="checkIcon(check)"
                  :color="checkColor(check)"
                  size="20px"
                />
                <div class="superbill-detail__check-body">
                  <button
                    type="button"
                    class="superbill-detail__check-toggle"
                    :data-testid="tid.requirementRow(
                      check.code,
                      check.serviceLineId,
                    )"
                    @click="toggleCheck(check)">
                    <strong>{{ checkTitle(check) }}</strong>
                    <q-icon
                      :name="isCheckOpen(check)
                        ? 'expand_less'
                        : 'expand_more'"
                      size="18px"
                    />
                  </button>
                  <p
                    v-if="check.message && !check.passed"
                    class="text-body2 text-grey-7 q-mb-none">
                    {{ check.message }}
                  </p>
                  <div
                    v-if="isCheckOpen(check)"
                    class="superbill-detail__evidence">
                    <p
                      v-if="check.summary && check.passed"
                      class="text-body2 q-mb-sm">
                      {{ check.summary }}
                    </p>
                    <dl
                      v-if="evidenceEntries(check).length"
                      class="superbill-detail__facts">
                      <div
                        v-for="entry in evidenceEntries(check)"
                        :key="entry.key">
                        <dt>{{ evidenceLabel(entry.key) }}</dt>
                        <dd>{{ entry.value }}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <q-btn
                  v-if="check.action"
                  no-caps
                  outline
                  dense
                  color="primary"
                  class="app-btn-outline"
                  :data-testid="tid.requirementAction(
                    check.code,
                    check.serviceLineId,
                  )"
                  :label="actionLabel(check)"
                  @click="onRequirementAction(check)"
                />
              </li>
            </ul>
          </section>

          <section class="superbill-detail__card q-mt-md">
            <h2>{{ t('superbillSummary') }}</h2>
            <div class="superbill-detail__summary">
              <div class="superbill-detail__stat">
                <span class="superbill-detail__stat-icon
                  superbill-detail__stat-icon--blue">
                  <q-icon name="medical_services" size="18px" />
                </span>
                <div>
                  <div class="text-caption text-grey-7">
                    {{ t('superbillSummaryServices') }}
                  </div>
                  <strong>{{ detail.lines.length }}</strong>
                </div>
              </div>
              <div class="superbill-detail__stat">
                <span class="superbill-detail__stat-icon
                  superbill-detail__stat-icon--green">
                  <q-icon name="tag" size="18px" />
                </span>
                <div>
                  <div class="text-caption text-grey-7">
                    {{ t('superbillSummaryUnits') }}
                  </div>
                  <strong>{{ detail.unitsTotal }}</strong>
                </div>
              </div>
              <div class="superbill-detail__stat">
                <span class="superbill-detail__stat-icon
                  superbill-detail__stat-icon--purple">
                  <q-icon name="payments" size="18px" />
                </span>
                <div>
                  <div class="text-caption text-grey-7">
                    {{ t('superbillSummaryCharges') }}
                  </div>
                  <strong>{{ detail.totalChargeLabel || '—' }}</strong>
                </div>
              </div>
              <div class="superbill-detail__stat">
                <span class="superbill-detail__stat-icon
                  superbill-detail__stat-icon--orange">
                  <q-icon name="location_on" size="18px" />
                </span>
                <div>
                  <div class="text-caption text-grey-7">
                    {{ t('superbillPlaceOfService') }}
                  </div>
                  <strong>{{ posSummary || '—' }}</strong>
                </div>
              </div>
            </div>
          </section>

          <section class="superbill-detail__card q-mt-md">
            <div class="row items-center justify-between">
              <h2 class="q-mb-none">{{ t('superbillNotes') }}</h2>
              <q-btn
                v-if="canEditBillingFields && !detail.isVoided"
                no-caps
                outline
                dense
                color="primary"
                class="app-btn-outline"
                icon="edit"
                :data-testid="tid.addNote"
                :label="t('superbillAddNote')"
                @click="noteOpen = true"
              />
            </div>
            <p
              v-if="!detail.notes.length"
              class="text-body2 text-grey-7 q-mb-none q-mt-sm">
              {{ t('superbillNotesEmpty') }}
            </p>
            <ul v-else class="superbill-detail__notes q-mt-sm">
              <li
                v-for="note in detail.notes"
                :key="note.id">
                <p class="q-mb-none">{{ note.body }}</p>
                <span class="text-caption text-grey-7">
                  {{ formatWhen(note.createdAt) }}
                </span>
              </li>
            </ul>
          </section>
        </div>

        <aside class="superbill-detail__side">
          <section class="superbill-detail__card">
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('superbillMetaClient') }}</dt>
                <dd>{{ clientMeta }}</dd>
                <button
                  v-if="detail.clientId"
                  type="button"
                  class="admin-data-table__link"
                  :data-testid="tid.viewClient"
                  @click="goToClient">
                  {{ t('superbillViewClient') }}
                </button>
              </div>
              <div>
                <dt>{{ t('superbillMetaPayer') }}</dt>
                <dd>{{ payerMeta }}</dd>
                <button
                  v-if="detail.clientId"
                  type="button"
                  class="admin-data-table__link"
                  @click="goToClientInsurance">
                  {{ t('superbillViewInsurance') }}
                </button>
              </div>
              <div>
                <dt>{{ t('superbillRenderingProvider') }}</dt>
                <dd>{{ providerLine(detail.renderingProvider) }}</dd>
              </div>
              <div>
                <dt>{{ t('superbillBillingProvider') }}</dt>
                <dd>{{ providerLine(detail.billingProvider) }}</dd>
              </div>
              <div>
                <dt>{{ t('superbillLocation') }}</dt>
                <dd>{{ locationLine }}</dd>
              </div>
              <div>
                <dt>{{ t('superbillMetaDos') }}</dt>
                <dd>{{ detail.dateOfServiceDisplay || '—' }}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <section
        v-else-if="activeTab === 'services'"
        class="superbill-detail__card">
        <h2>{{ t('superbillTabServices') }}</h2>
        <div class="superbill-detail__table-wrap">
          <table class="superbill-detail__table">
            <thead>
              <tr>
                <th>{{ t('superbillCpt') }}</th>
                <th>{{ t('superbillService') }}</th>
                <th>{{ t('superbillUnits') }}</th>
                <th>{{ t('superbillDuration') }}</th>
                <th>{{ t('superbillPos') }}</th>
                <th>{{ t('superbillCharge') }}</th>
                <th>{{ t('superbillRenderingProvider') }}</th>
                <th>{{ t('superbillAuthorization') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!detail.lines.length">
                <td
                  colspan="8"
                  class="text-grey-7">
                  {{ t('superbillServicesEmpty') }}
                </td>
              </tr>
              <tr
                v-for="line in detail.lines"
                :key="line.id">
                <td>{{ line.billingCode || '—' }}</td>
                <td>
                  <div>{{ line.serviceName || '—' }}</div>
                  <div class="text-caption text-grey-7">
                    {{ t('superbillDiagnoses') }}:
                    {{ line.diagnosisCodes.join(', ') || '—' }}
                  </div>
                </td>
                <td>{{ line.units }}</td>
                <td>{{ line.durationMinutes || '—' }}</td>
                <td>{{ line.placeOfServiceCode || '—' }}</td>
                <td>{{ line.chargeLabel || '—' }}</td>
                <td>{{ line.renderingProviderName || '—' }}</td>
                <td>{{ authLabel(line) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-right q-mt-md">
          <strong>
            {{ t('superbillSummaryCharges') }}:
            {{ detail.totalChargeLabel || '—' }}
          </strong>
        </p>
      </section>

      <section
        v-else-if="activeTab === 'diagnoses'"
        class="superbill-detail__card">
        <h2>{{ t('superbillTabDiagnoses') }}</h2>
        <ul class="superbill-detail__dx">
          <li
            v-for="dx in detail.diagnoses"
            :key="dx.id || dx.diagnosisCode">
            <q-badge
              outline
              :color="dx.primary ? 'primary' : 'grey'">
              {{ dx.primary
                ? t('superbillPrimary')
                : t('superbillSecondary') }}
            </q-badge>
            <div>
              <strong>{{ dx.diagnosisCode }}</strong>
              <p class="text-body2 text-grey-7 q-mb-none">
                {{ dx.diagnosisDescription }}
              </p>
            </div>
          </li>
          <li
            v-if="!detail.diagnoses.length"
            class="text-grey-7">
            {{ t('encounterDiagnosesEmpty') }}
          </li>
        </ul>
        <div
          v-if="diagnosisAssignments.length"
          class="q-mt-md">
          <h3>{{ t('superbillServiceMapping') }}</h3>
          <ul class="superbill-detail__notes">
            <li
              v-for="item in diagnosisAssignments"
              :key="item.code">
              {{ item.label }}
            </li>
          </ul>
        </div>
      </section>

      <section
        v-else-if="activeTab === 'billing'"
        class="superbill-detail__card">
        <h2>{{ t('superbillTabBillingInfo') }}</h2>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <h3>{{ t('superbillMetaClient') }}</h3>
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('superbillMetaClient') }}</dt>
                <dd>{{ detail.client.fullName || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('superbillDob') }}</dt>
                <dd>{{ detail.client.dobDisplay || '—' }}</dd>
              </div>
            </dl>
          </div>
          <div class="col-12 col-md-6">
            <h3>{{ t('superbillColumnInsurance') }}</h3>
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('superbillBillingResponsibility') }}</dt>
                <dd>{{ responsibilityLabel }}</dd>
              </div>
              <div>
                <dt>{{ t('superbillPayerName') }}</dt>
                <dd>{{ payerMeta }}</dd>
              </div>
              <div>
                <dt>{{ t('superbillInsuranceType') }}</dt>
                <dd>
                  {{ detail.insurance.insuranceType
                    || t('superbillMissingValue') }}
                </dd>
              </div>
              <div>
                <dt>{{ t('superbillMemberId') }}</dt>
                <dd>
                  {{ detail.insurance.memberIdMasked
                    || t('superbillMissingValue') }}
                </dd>
              </div>
            </dl>
          </div>
          <div class="col-12">
            <h3>{{ t('superbillDocumentation') }}</h3>
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('superbillClinicalNote') }}</dt>
                <dd>
                  {{ t('superbillNoteStatus') }}:
                  {{ detail.documentation.status
                    || t('superbillMissingValue') }}
                  <q-btn
                    v-if="detail.encounterId"
                    no-caps
                    flat
                    dense
                    color="primary"
                    class="q-ml-sm"
                    :data-testid="tid.viewNote"
                    :label="t('superbillViewNote')"
                    @click="goToEncounter('note')"
                  />
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section
        v-else
        class="superbill-detail__card">
        <h2>{{ t('superbillTabHistory') }}</h2>
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
            {{ t('superbillHistoryEmpty') }}
          </li>
        </ul>
      </section>

      <footer class="superbill-detail__footer">
        <span>
          {{ t('superbillFooterId', {
            number: detail.superbillNumber,
          }) }}
        </span>
        <span>
          {{ t('superbillFooterUpdated', {
            when: formatWhen(detail.updatedAt || detail.generatedAt),
          }) }}
        </span>
      </footer>
    </template>

    <div
      v-else-if="!loading"
      class="superbill-detail__empty">
      {{ loadError || t('superbillLoadError') }}
    </div>

    <SuperbillHoldDialog
      v-model="holdOpen"
      :submitting="actionBusy"
      @confirm="onHold"
    />
    <SuperbillReasonDialog
      v-model="voidOpen"
      :title="t('superbillVoidTitle')"
      :message="t('superbillVoidMessage')"
      :reason-label="t('superbillVoidReasonLabel')"
      :reason-placeholder="t('superbillVoidReasonPlaceholder')"
      :confirm-label="t('superbillVoidConfirm')"
      :submitting="actionBusy"
      test-id-name="superbill-void"
      @confirm="onVoid"
    />
    <SuperbillReasonDialog
      v-model="reopenOpen"
      :title="t('superbillReopenTitle')"
      :message="t('superbillReopenMessage')"
      :reason-label="t('superbillReopenReasonLabel')"
      :reason-placeholder="t('superbillReopenReasonPlaceholder')"
      :confirm-label="t('superbillReopenConfirm')"
      :submitting="actionBusy"
      test-id-name="superbill-reopen"
      @confirm="onReopen"
    />
    <SuperbillReasonDialog
      v-model="noteOpen"
      :title="t('superbillAddNoteTitle')"
      :reason-label="t('superbillNoteBodyLabel')"
      :reason-placeholder="t('superbillNoteBodyPlaceholder')"
      :confirm-label="t('superbillAddNote')"
      :submitting="actionBusy"
      test-id-name="superbill-note"
      @confirm="onAddNote"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  addClientCareCoordinationSubTabKeys,
  addClientTabKeys,
  billingResponsibilityValues,
  quasarNotifyTypes,
  superbillRequirementActions,
  superbillStatuses,
} from 'components/constants.js'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import SuperbillHoldDialog from
  'components/billing/SuperbillHoldDialog.vue'
import SuperbillReasonDialog from
  'components/billing/SuperbillReasonDialog.vue'
import { useSuperbillPermissions } from
  'src/composables/useSuperbillPermissions.js'
import { useClaimPermissions } from
  'src/composables/useClaimPermissions.js'
import { superbillDetailTestIds as tid } from
  'src/test-ids/index.js'
import { formatDateTime } from 'src/utils/app-datetime.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { clientChartKey } from 'components/helpers.js'
import {
  addSuperbillNote,
  fetchSuperbillById,
  fetchSuperbillHistory,
  isSuperbillHasSubmittedClaimError,
  isSuperbillNotReadyError,
  markSuperbillReviewed,
  putSuperbillOnHold,
  releaseSuperbillHold,
  reopenSuperbill,
  superbillApiErrorMessage,
  voidSuperbill,
} from 'src/utils/superbill-api.js'
import {
  claimApiErrorMessage,
  generateClaimFromSuperbill,
} from 'src/utils/claim-api.js'
import {
  superbillRequirementActionLabelKey,
  superbillRequirementLabelKey,
  superbillWorkspaceTabForAction,
} from 'src/utils/superbill-normalize.js'
import { useSyncAppPageTitle } from
  'src/composables/useAppPageTitle.js'

const { t, te } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const {
  canReviewSuperbill,
  canReopenSuperbill,
  canVoidSuperbill,
  canEditBillingFields,
  canHoldSuperbill,
  canReleaseHold,
} = useSuperbillPermissions()
const { canGenerateClaim, canViewClaims } = useClaimPermissions()

useSyncAppPageTitle(computed(() => t('billingReviewTitle')))

const readyStatus = superbillStatuses.ready
const loading = ref(false)
const actionBusy = ref(false)
const detail = ref(null)
const loadError = ref('')
const activeTab = ref('overview')
const voidOpen = ref(false)
const reopenOpen = ref(false)
const holdOpen = ref(false)
const noteOpen = ref(false)
const openChecks = ref({})
const historyItems = ref([])

const superbillId = computed(() =>
  String(route.params.id ?? '').trim(),
)

const tabs = computed(() => [
  { key: 'overview', label: t('superbillTabOverview') },
  { key: 'services', label: t('superbillTabServices') },
  { key: 'diagnoses', label: t('superbillTabDiagnoses') },
  { key: 'billing', label: t('superbillTabBillingInfo') },
  { key: 'history', label: t('superbillTabHistory') },
])

const readinessChecks = computed(() =>
  Array.isArray(detail.value?.billingRequirements?.checks)
    ? detail.value.billingRequirements.checks
    : [],
)

const blockingChecks = computed(() =>
  readinessChecks.value.filter(item =>
    !item.passed && item.severity === 'BLOCKING'),
)

const showMarkReviewed = computed(() =>
  canReviewSuperbill.value
  && detail.value?.isVoided !== true
  && detail.value?.isReviewed !== true,
)

const markReviewedEnabled = computed(() =>
  showMarkReviewed.value && detail.value?.canMarkReviewed === true,
)

const reviewHint = computed(() => {
  if (detail.value?.onHold) {
    return t('billingReviewHoldHint')
  }

  return t('billingReviewEnableHint')
})

const canGenerateClaimFromSuperbill = computed(() =>
  canGenerateClaim.value
  && detail.value?.isReviewed === true
  && detail.value?.billingResponsibility
    === billingResponsibilityValues.insurance
  && !detail.value?.activeClaim?.id,
)

const canPutOnHold = computed(() =>
  canHoldSuperbill.value
  && detail.value?.isOpen === true
  && detail.value?.onHold !== true
  && detail.value?.isVoided !== true
  && detail.value?.isReviewed !== true,
)

const canReleaseActiveHold = computed(() =>
  canReleaseHold.value && detail.value?.onHold === true,
)

const canReopen = computed(() =>
  canReopenSuperbill.value && detail.value?.isReviewed === true,
)

const canVoid = computed(() =>
  canVoidSuperbill.value && detail.value?.isVoided !== true,
)

const showActionsMenu = computed(() =>
  canReopen.value || canVoid.value,
)

const clientMeta = computed(() => {
  const client = detail.value?.client || {}
  const name = client.fullName || '—'
  if (!client.clientNumber) {
    return name
  }

  return `${name} (${t('superbillMrn', {
    number: client.clientNumber,
  })})`
})

const payerMeta = computed(() => {
  if (detail.value?.billingResponsibility
    === billingResponsibilityValues.selfPay) {
    return t('superbillSelfPay')
  }

  return detail.value?.insurance?.payerName
    || t('superbillMissingValue')
})

const responsibilityLabel = computed(() => {
  if (detail.value?.billingResponsibility
    === billingResponsibilityValues.selfPay) {
    return t('superbillSelfPay')
  }

  return t('superbillColumnInsurance')
})

const locationLine = computed(() => {
  const location = detail.value?.location || {}
  const pos = [location.placeOfServiceCode, location.placeOfServiceDescription]
    .filter(Boolean)
    .join(' — ')
  const name = location.name || ''
  if (name && pos) {
    return `${name} · ${pos}`
  }

  return name || pos || t('superbillMissingValue')
})

const headerClientLine = computed(() => {
  const name = detail.value?.client?.fullName || '—'
  const dos = detail.value?.dateOfServiceDisplay || '—'

  return `${name} • ${dos}`
})

const headerIdsLine = computed(() => {
  const sb = detail.value?.superbillNumber || '—'
  const enc = detail.value?.encounterNumber || '—'

  return `${sb} • ${enc}`
})

const posSummary = computed(() => {
  const location = detail.value?.location || {}
  const code = location.placeOfServiceCode
  const name = location.placeOfServiceDescription
  if (code && name) {
    return `${code} ${t('superbillPos')} — ${name}`
  }

  return code || name || ''
})

const diagnosisAssignments = computed(() =>
  (detail.value?.lines || [])
    .filter(line => line.billingCode)
    .map(line => ({
      code: line.billingCode,
      label: `${line.billingCode} → ${
        line.diagnosisCodes.join(', ') || '—'
      }`,
    })),
)

const reviewedMeta = computed(() => {
  if (!detail.value?.reviewedAt) {
    return ''
  }

  return t('superbillReviewedBy', {
    name: formatWhen(detail.value.reviewedAt),
  })
})

function statusLabel(status) {
  if (status === superbillStatuses.ready) {
    return t('superbillStatusReady')
  }
  if (status === superbillStatuses.reviewed) {
    return t('superbillStatusReviewed')
  }
  if (status === superbillStatuses.voided) {
    return t('superbillStatusVoided')
  }

  return t('superbillStatusNotReady')
}

function formatWhen(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return '—'
  }

  return formatDateTime(raw) || raw
}

function providerLine(provider = {}) {
  const name = provider.name || t('superbillMissingValue')
  if (!provider.npi) {
    return name
  }

  return `${name} (${t('superbillNpi', { npi: provider.npi })})`
}

function checkKey(check) {
  return [
    check.code,
    check.serviceLineId,
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

function checkTitle(check) {
  const key = superbillRequirementLabelKey(check.code)
  if (key && te(key)) {
    return t(key)
  }

  return check.label || check.serviceName || check.code || check.message
}

function actionLabel(check) {
  if (check?.actionLabel) {
    const mapped = superbillRequirementActionLabelKey(check.action)
    if (mapped && te(mapped)) {
      return t(mapped)
    }

    return check.actionLabel
  }
  const key = superbillRequirementActionLabelKey(check?.action || check)

  return key ? t(key) : (check?.action || check)
}

function toggleCheck(check) {
  const key = checkKey(check)
  openChecks.value = {
    ...openChecks.value,
    [key]: !openChecks.value[key],
  }
}

function isCheckOpen(check) {
  return Boolean(openChecks.value[checkKey(check)])
}

function evidenceEntries(check) {
  const evidence = check?.evidence || {}

  return Object.entries(evidence)
    .filter(([, value]) => {
      if (value == null || value === '') {
        return false
      }
      if (typeof value === 'object' && !Array.isArray(value)) {
        return false
      }

      return true
    })
    .map(([key, value]) => ({
      key,
      value: Array.isArray(value) ? value.join(', ') : String(value),
    }))
}

function evidenceLabel(key) {
  const map = {
    payer: 'superbillPayerName',
    planType: 'superbillInsuranceType',
    memberIdMasked: 'superbillMemberId',
    coverageStartDate: 'billingEvidenceCoverageStart',
    coverageEndDate: 'billingEvidenceCoverageEnd',
    dateOfService: 'superbillMetaDos',
    validForDos: 'billingEvidenceValidForDos',
    encounterNumber: 'superbillMetaEncounter',
    primary: 'superbillPrimary',
    secondary: 'superbillSecondary',
    serviceAssignment: 'superbillServiceMapping',
    code: 'superbillCpt',
    name: 'superbillService',
    units: 'superbillUnits',
    charge: 'superbillCharge',
    placeOfServiceCode: 'superbillPos',
    renderingProvider: 'superbillRenderingProvider',
    source: 'billingEvidenceSource',
    status: 'superbillNoteStatus',
    signedBy: 'billingEvidenceSignedBy',
    signedAt: 'billingEvidenceSignedAt',
    serviceCode: 'superbillCpt',
    serviceName: 'superbillService',
    assignedDiagnoses: 'superbillDiagnoses',
    authorizationNumber: 'superbillAuthNumber',
    authorizationStatus: 'superbillReqAuthorization',
    remaining: 'superbillAuthRemaining',
    approved: 'superbillAuthApproved',
    startDate: 'superbillAuthValidFrom',
    endDate: 'superbillAuthValidTo',
  }
  const i18nKey = map[key]
  if (i18nKey && te(i18nKey)) {
    return t(i18nKey)
  }

  return key
}

function historyActionLabel(action) {
  const map = {
    SUPERBILL_CREATED: 'superbillHistoryCreated',
    SUPERBILL_STATUS_CHANGED: 'superbillHistoryStatusChanged',
    SUPERBILL_REVIEWED: 'superbillHistoryReviewed',
    SUPERBILL_REOPENED: 'superbillHistoryReopened',
    SUPERBILL_VOIDED: 'superbillHistoryVoided',
    SUPERBILL_NOTE_CREATED: 'superbillHistoryNoteCreated',
    SUPERBILL_PUT_ON_HOLD: 'superbillHistoryPutOnHold',
    SUPERBILL_HOLD_RELEASED: 'superbillHistoryHoldReleased',
    SUPERBILL_READY: 'superbillHistoryReady',
  }
  const key = map[action]
  if (key && te(key)) {
    return t(key)
  }

  return action || t('superbillHistoryCreated')
}

function authLabel(line) {
  if (line.authorizationLabel === 'required-missing') {
    return t('superbillAuthRequiredMissing')
  }
  if (line.authorizationLabel === 'not-required') {
    return t('superbillAuthNotRequired')
  }

  return line.authorizationLabel || t('superbillAuthNotRequired')
}

function billingReturnQuery(extra = {}) {
  const id = detail.value?.id
  if (id == null) {
    return extra
  }

  return { ...extra, returnSuperbillId: String(id) }
}

function goToEncounter(tab) {
  const id = detail.value?.encounterId
  if (id == null) {
    return
  }
  void router.push({
    name: 'EncounterWorkspace',
    params: { id: String(id) },
    query: billingReturnQuery(tab ? { tab } : {}),
  })
}

function goToClaim() {
  const id = detail.value?.activeClaim?.id
  if (id == null) {
    return
  }
  void router.push({
    name: 'ClaimDetail',
    params: { id: String(id) },
  })
}

async function onGenerateClaim() {
  const id = detail.value?.id
  if (id == null) {
    return
  }
  actionBusy.value = true
  try {
    const claim = await generateClaimFromSuperbill(id)
    detail.value = await fetchSuperbillById(id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('superbillGenerateClaimSuccess'),
    })
    if (claim?.id && canViewClaims.value) {
      void router.push({
        name: 'ClaimDetail',
        params: { id: String(claim.id) },
      })
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: claimApiErrorMessage(
          error,
          t('superbillGenerateClaimError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}

function goToClient() {
  const id = clientChartKey(detail.value?.client)
  if (!id) {
    return
  }
  void router.push({
    name: 'ClientOverview',
    params: { id },
    query: billingReturnQuery(),
  })
}

function goToClientInsurance() {
  const id = clientChartKey(detail.value?.client)
  if (!id) {
    return
  }
  void router.push({
    name: 'EditClient',
    params: { id },
    query: billingReturnQuery({ tab: 'insurance' }),
  })
}

function goToClientAuthorizations() {
  const id = clientChartKey(detail.value?.client)
  if (!id) {
    return
  }
  void router.push({
    name: 'EditClient',
    params: { id },
    query: billingReturnQuery({
      tab: addClientTabKeys.careCoordination,
      subTab: addClientCareCoordinationSubTabKeys.authorizations,
    }),
  })
}

function onRequirementAction(check) {
  if (check.action === superbillRequirementActions.viewInsurance) {
    goToClientInsurance()

    return
  }
  if (check.action
    === superbillRequirementActions.reviewAuthorization) {
    goToClientAuthorizations()

    return
  }
  goToEncounter(superbillWorkspaceTabForAction(check.action))
}

function onPrint() {
  window.print()
}

function notifyError(error, fallback) {
  if (isAuthSessionEndUIError(error)) {
    return
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: isSuperbillHasSubmittedClaimError(error)
      ? t('superbillHasSubmittedClaim')
      : superbillApiErrorMessage(error, fallback),
  })
}

async function loadDetail() {
  if (!superbillId.value) {
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    detail.value = await fetchSuperbillById(superbillId.value)
    try {
      const history = await fetchSuperbillHistory(superbillId.value)
      historyItems.value = history.items
    } catch {
      historyItems.value = []
    }
  } catch (error) {
    detail.value = null
    historyItems.value = []
    loadError.value = superbillApiErrorMessage(
      error,
      t('superbillLoadError'),
    )
    notifyError(error, t('superbillLoadError'))
  } finally {
    loading.value = false
  }
}

async function onMarkReviewed() {
  if (!detail.value) {
    return
  }
  actionBusy.value = true
  try {
    detail.value = await markSuperbillReviewed(
      detail.value.id,
      detail.value.version,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('superbillReviewSuccess'),
    })
  } catch (error) {
    if (isSuperbillNotReadyError(error)) {
      await loadDetail()
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('superbillReviewRejected'),
      })
    } else {
      notifyError(error, t('superbillActionError'))
    }
  } finally {
    actionBusy.value = false
  }
}

async function onHold({ reason, notes }) {
  if (!detail.value) {
    return
  }
  actionBusy.value = true
  try {
    detail.value = await putSuperbillOnHold(detail.value.id, {
      reason,
      notes,
      version: detail.value.version,
    })
    holdOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('superbillHoldSuccess'),
    })
  } catch (error) {
    notifyError(error, t('superbillActionError'))
  } finally {
    actionBusy.value = false
  }
}

async function onReleaseHold() {
  if (!detail.value) {
    return
  }
  actionBusy.value = true
  try {
    detail.value = await releaseSuperbillHold(
      detail.value.id,
      detail.value.version,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('superbillReleaseHoldSuccess'),
    })
  } catch (error) {
    notifyError(error, t('superbillActionError'))
  } finally {
    actionBusy.value = false
  }
}

async function onVoid(reason) {
  actionBusy.value = true
  try {
    detail.value = await voidSuperbill(detail.value.id, {
      reason,
      version: detail.value.version,
    })
    voidOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('superbillVoidSuccess'),
    })
  } catch (error) {
    notifyError(error, t('superbillActionError'))
  } finally {
    actionBusy.value = false
  }
}

async function onReopen(reason) {
  actionBusy.value = true
  try {
    detail.value = await reopenSuperbill(detail.value.id, {
      reason,
      version: detail.value.version,
    })
    reopenOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('superbillReopenSuccess'),
    })
  } catch (error) {
    notifyError(error, t('superbillActionError'))
  } finally {
    actionBusy.value = false
  }
}

async function onAddNote(body) {
  actionBusy.value = true
  try {
    detail.value = await addSuperbillNote(detail.value.id, body)
    noteOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('superbillNoteSuccess'),
    })
  } catch (error) {
    notifyError(error, t('superbillActionError'))
  } finally {
    actionBusy.value = false
  }
}

watch(superbillId, () => {
  void loadDetail()
})

onMounted(() => {
  void loadDetail()
})
</script>
