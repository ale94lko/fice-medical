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
                :label="statusLabel(detail.displayStatus || detail.status)"
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
              v-if="canSubmit"
              no-caps
              unelevated
              color="primary"
              class="app-btn-primary"
              :data-testid="tid.submit"
              :label="t('claimSubmit')"
              @click="submitOpen = true"
            />
            <q-btn
              v-if="canRetry"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid.retry"
              :label="t('claimRetrySubmission')"
              @click="onRetry"
            />
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
              <div v-if="detail.claimRelationshipType">
                <dt>{{ t('claimRelationship') }}</dt>
                <dd>
                  {{ relationshipLabel(
                    detail.claimRelationshipType,
                  ) }}
                </dd>
              </div>
            </dl>
          </section>
          <section
            v-if="detail.lineage?.length > 1
              || detail.denialCases?.length"
            class="superbill-detail__card q-mt-lg">
            <h2>{{ t('claimLineageTitle') }}</h2>
            <ul class="superbill-detail__history">
              <li
                v-for="item in detail.lineage"
                :key="item.id">
                <button
                  type="button"
                  class="admin-data-table__link"
                  @click="goToClaimId(item.id)">
                  {{ item.claimNumber }}
                </button>
                · {{ relationshipLabel(item.claimRelationshipType) }}
                · {{ statusLabel(item.status) }}
              </li>
              <li
                v-for="item in detail.denialCases"
                :key="`den-${item.id}`">
                <button
                  type="button"
                  class="admin-data-table__link"
                  @click="goToDenial(item.id)">
                  {{ item.denialNumber }}
                </button>
                · {{ item.status }}
              </li>
            </ul>
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
            <dt>{{ t('claimProcessingStatus') }}</dt>
            <dd>{{ processingStatusLabel(detail.status) }}</dd>
          </div>
          <div>
            <dt>{{ t('claimDisplayStatus') }}</dt>
            <dd>{{ statusLabel(detail.displayStatus || detail.status) }}</dd>
          </div>
          <div>
            <dt>{{ t('claimAdjudicationDimension') }}</dt>
            <dd>{{ adjudicationDimensionLabel(
              detail.adjudicationStatus) }}</dd>
          </div>
          <div>
            <dt>{{ t('claimDenialDimension') }}</dt>
            <dd>{{ denialDimensionLabel(detail.denialStatus) }}</dd>
          </div>
          <div>
            <dt>{{ t('claimPayerPaymentDimension') }}</dt>
            <dd>{{ payerPaymentDimensionLabel(
              detail.payerPaymentStatus) }}</dd>
          </div>
        </dl>
      </section>

      <section
        v-else-if="activeTab === 'submission'"
        class="superbill-detail__card">
        <h2>{{ t('claimTabSubmission') }}</h2>
        <div
          v-if="detail.isReady && submissionReady"
          class="superbill-detail__ready">
          <q-icon name="check_circle" color="positive" size="22px" />
          <div>
            <strong>{{ t('claimSubmissionReadyTitle') }}</strong>
            <p class="text-body2 text-grey-7 q-mb-none">
              {{ t('claimSubmissionReadyBody') }}
            </p>
          </div>
        </div>
        <div
          v-else-if="detail.isReady && !submissionReady"
          class="superbill-detail__alert">
          <strong>{{ t('claimSubmissionNotReadyTitle') }}</strong>
          <p class="text-body2 q-mb-none">
            {{ t('claimSubmissionNotReadyBody', {
              count: submissionBlocking.length,
            }) }}
          </p>
        </div>
        <div
          v-else-if="detail.isSubmitted"
          class="superbill-detail__ready">
          <q-icon name="send" color="primary" size="22px" />
          <div>
            <strong>{{ t('claimStatusSubmitted') }}</strong>
            <p class="text-body2 text-grey-7 q-mb-none">
              {{ formatWhen(detail.submittedAt
                || latestSubmission?.submittedAt) }}
              · {{ t('claimSubmissionAwaitingAck') }}
            </p>
          </div>
        </div>
        <div
          v-else-if="detail.isAccepted"
          class="superbill-detail__ready">
          <q-icon name="verified" color="positive" size="22px" />
          <div>
            <strong>{{ t('claimStatusAccepted') }}</strong>
            <p class="text-body2 text-grey-7 q-mb-none">
              {{ t('claimSubmissionAcceptedBody') }}
            </p>
          </div>
        </div>
        <div
          v-else-if="detail.isRejected"
          class="superbill-detail__alert">
          <strong>{{ t('claimStatusRejected') }}</strong>
          <p class="text-body2 q-mb-none">
            {{ detail.latestRejectionMessage
              || t('claimAckRejected') }}
          </p>
        </div>
        <dl class="superbill-detail__facts q-mt-md">
          <div>
            <dt>{{ t('claimSubmissionFormat') }}</dt>
            <dd>837P</dd>
          </div>
          <div>
            <dt>{{ t('claimSubmissionVersion') }}</dt>
            <dd>{{ latestSubmission?.implementationVersion
              || '005010X222A1' }}</dd>
          </div>
          <div>
            <dt>{{ t('claimColumnPayer') }}</dt>
            <dd>{{ detail.insurance?.payerName || '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('claimSubmissionRoute') }}</dt>
            <dd>{{ latestSubmission?.clearinghouseName
              || latestSubmission?.routeName
              || '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('claimSubmissionElectronicPayerId') }}</dt>
            <dd>{{ latestSubmission?.electronicPayerId
              || electronicPayerEvidence
              || '—' }}</dd>
          </div>
          <div v-if="latestSubmission?.attemptNumber">
            <dt>{{ t('claimSubmissionAttempt') }}</dt>
            <dd>#{{ latestSubmission.attemptNumber }}</dd>
          </div>
          <div v-if="latestSubmission?.externalTrackingId">
            <dt>{{ t('claimSubmissionTracking') }}</dt>
            <dd>{{ latestSubmission.externalTrackingId }}</dd>
          </div>
          <div>
            <dt>{{ t('claimAck999') }}</dt>
            <dd>{{ ackLabel(latestSubmission?.ack999) }}</dd>
          </div>
          <div>
            <dt>{{ t('claimAck277ca') }}</dt>
            <dd>{{ ackLabel(latestSubmission?.ack277ca) }}</dd>
          </div>
        </dl>
        <div
          v-for="group in groupedSubmissionChecks"
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
        <div v-if="canSubmit" class="q-mt-lg">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :data-testid="tid.submit"
            :label="t('claimSubmit')"
            @click="submitOpen = true"
          />
        </div>
      </section>

      <section
        v-else-if="activeTab === 'adjudication'"
        class="superbill-detail__card">
        <h2>{{ t('claimTabAdjudication') }}</h2>
        <div
          v-if="!latestAdjudication"
          class="text-body2 text-grey-7">
          {{ t('claimAdjudicationEmpty') }}
        </div>
        <template v-else>
          <p
            v-if="detail.isDenied"
            class="superbill-detail__alert">
            {{ t('claimDeniedNotPatientBalance') }}
          </p>
          <dl class="superbill-detail__facts">
            <div>
              <dt>{{ t('claimColumnStatus') }}</dt>
              <dd>
                {{ statusLabel(detail.displayStatus || detail.status) }}
              </dd>
            </div>
            <div>
              <dt>{{ t('claimAdjBilled') }}</dt>
              <dd>{{ latestAdjudication.billedAmountLabel }}</dd>
            </div>
            <div>
              <dt>{{ t('claimAdjAllowed') }}</dt>
              <dd>{{ latestAdjudication.allowedAmountLabel }}</dd>
            </div>
            <div>
              <dt>{{ t('claimAdjPaid') }}</dt>
              <dd>{{ latestAdjudication.payerPaidAmountLabel }}</dd>
            </div>
            <div>
              <dt>{{ t('claimAdjPatient') }}</dt>
              <dd>
                {{ latestAdjudication.clientResponsibilityAmountLabel }}
              </dd>
            </div>
            <div>
              <dt>{{ t('claimAdjAdjustments') }}</dt>
              <dd>{{ latestAdjudication.adjustmentAmountLabel }}</dd>
            </div>
            <div>
              <dt>{{ t('claimAdjEra') }}</dt>
              <dd>{{ latestAdjudication.remittanceNumber || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('claimAdjReceived') }}</dt>
              <dd>{{ formatWhen(latestAdjudication.receivedAt) }}</dd>
            </div>
          </dl>
          <div class="superbill-detail__table-wrap q-mt-lg">
            <table class="superbill-detail__table">
              <thead>
                <tr>
                  <th>{{ t('claimCpt') }}</th>
                  <th>{{ t('claimAdjBilled') }}</th>
                  <th>{{ t('claimAdjAllowed') }}</th>
                  <th>{{ t('claimAdjPaid') }}</th>
                  <th>{{ t('claimAdjPatient') }}</th>
                  <th>{{ t('claimAdjAdjustments') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="line in latestAdjudication.lines"
                  :key="line.id">
                  <td>
                    <div>{{ line.procedureCode || '—' }}</div>
                    <div class="text-caption text-grey-7">
                      {{ line.serviceName || '—' }}
                    </div>
                    <div
                      v-for="adj in line.adjustments"
                      :key="adj.id"
                      class="text-caption">
                      {{ adj.groupCode }}-{{ adj.reasonCode }}
                      {{ adj.amountLabel }}
                    </div>
                  </td>
                  <td>{{ line.billedAmountLabel }}</td>
                  <td>{{ line.allowedAmountLabel }}</td>
                  <td>{{ line.payerPaidAmountLabel }}</td>
                  <td>{{ line.clientResponsibilityAmountLabel }}</td>
                  <td>{{ line.adjustmentAmountLabel }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </section>

      <section
        v-else-if="activeTab === 'payments'"
        class="superbill-detail__card">
        <h2>{{ t('claimTabPayments') }}</h2>
        <p class="text-body2 text-grey-7">
          {{ t('claimInsurancePaymentsHint') }}
        </p>
        <div
          v-if="!detail.insurancePayments?.length"
          class="text-body2 text-grey-7">
          {{ t('claimInsurancePaymentsEmpty') }}
        </div>
        <ul v-else class="q-pl-none" style="list-style: none">
          <li
            v-for="payment in detail.insurancePayments"
            :key="payment.id"
            class="q-mb-md">
            <strong>{{ payment.paymentDate || '—' }}</strong>
            <div>{{ payment.payerName || '—' }}</div>
            <div class="text-caption text-grey-7">
              {{ payment.paymentMethod || '—' }}
              <template v-if="payment.eftTraceNumber">
                · {{ t('paymentTrace') }}
                {{ payment.eftTraceNumber }}
              </template>
            </div>
            <div>
              {{ t('claimAdjApplied') }}
              {{ payment.allocatedAmountLabel }}
            </div>
          </li>
        </ul>
      </section>

      <section
        v-else-if="activeTab === 'history'"
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
    <ClaimSubmitDialog
      v-model="submitOpen"
      :submitting="actionBusy"
      :claim-number="detail?.claimNumber"
      :payer-name="detail?.insurance?.payerName"
      :total-label="detail?.totalChargeLabel"
      :service-count="detail?.lines?.length || 0"
      @confirm="onSubmit"
    />
    <ClaimSubmissionRouteDialog
      v-model="routeOpen"
      @saved="onRouteSaved"
      @error="onRouteError"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  claimAdjudicationStatuses,
  claimDenialStatuses,
  claimDisplayStatuses,
  claimRequirementActions,
  claimStatuses,
  payerPaymentStatuses,
  addClientCareCoordinationSubTabKeys,
  addClientTabKeys,
  quasarNotifyTypes,
} from 'components/constants.js'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ClaimVoidDialog from
  'components/claims/ClaimVoidDialog.vue'
import ClaimSubmitDialog from
  'components/claims/ClaimSubmitDialog.vue'
import ClaimSubmissionRouteDialog from
  'components/claims/ClaimSubmissionRouteDialog.vue'
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
  retryClaimSubmission,
  submitClaim,
  voidClaim,
} from 'src/utils/claim-api.js'
import { claimRequirementActionLabelKey }
  from 'src/utils/claim-normalize.js'
import { isTechnicalSubmissionFailure }
  from 'src/utils/claim-work-queue.js'

const { t, te } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const {
  canVoidClaim,
  canSubmitClaim,
  canRetryTechnicalSubmission,
  canManageSubmissionRoute,
} = useClaimPermissions()

useSyncAppPageTitle(computed(() => t('claimWorkspaceTitle')))

const loading = ref(false)
const actionBusy = ref(false)
const detail = ref(null)
const loadError = ref('')
const activeTab = ref('overview')
const voidOpen = ref(false)
const submitOpen = ref(false)
const routeOpen = ref(false)
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
  { key: 'submission', label: t('claimTabSubmission') },
  { key: 'adjudication', label: t('claimTabAdjudication') },
  { key: 'payments', label: t('claimTabPayments') },
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

const groupedChecks = computed(() =>
  groupChecks(readinessChecks.value, [
    'PATIENT',
    'SUBSCRIBER',
    'PAYER',
    'PROVIDERS',
    'CLAIM_INFORMATION',
    'SERVICES',
    'DIAGNOSES',
  ]),
)

const submissionChecks = computed(() =>
  Array.isArray(detail.value?.submissionReadiness?.checks)
    ? detail.value.submissionReadiness.checks
    : [],
)

const submissionBlocking = computed(() =>
  submissionChecks.value.filter(item =>
    !item.passed && item.severity === 'BLOCKING'),
)

const groupedSubmissionChecks = computed(() =>
  groupChecks(submissionChecks.value, [
    'CLAIM',
    'ROUTE',
    'FORMAT',
    'SUBMITTER',
    'RECEIVER',
    'PAYER',
  ]),
)

const submissionReady = computed(() =>
  detail.value?.submissionReadiness?.ready === true,
)

const latestSubmission = computed(() =>
  detail.value?.latestSubmission || null,
)
const latestAdjudication = computed(() =>
  detail.value?.latestAdjudication || null,
)

const electronicPayerEvidence = computed(() => {
  const check = submissionChecks.value.find(item =>
    item.code === 'ELECTRONIC_PAYER_ID_PRESENT')

  return check?.evidence?.electronic_payer_id || ''
})

function groupChecks(checks, order) {
  const byCategory = new Map()
  for (const check of checks) {
    const key = check.category || order[0]
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
}

const canVoid = computed(() =>
  canVoidClaim.value
  && (detail.value?.isDraft === true
    || detail.value?.isReady === true),
)

const canSubmit = computed(() =>
  canSubmitClaim.value
  && detail.value?.isReady === true
  && submissionReady.value === true,
)

const canRetry = computed(() =>
  canRetryTechnicalSubmission.value
  && detail.value?.isReady === true
  && isTechnicalSubmissionFailure(latestSubmission.value?.status),
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
  if (status === claimStatuses.submitted) {
    return t('claimStatusSubmitted')
  }
  if (status === claimDisplayStatuses.awaitingAdjudication) {
    return t('claimDisplayAwaitingAdjudication')
  }
  if (status === claimStatuses.accepted) {
    return t('claimStatusAccepted')
  }
  if (status === claimStatuses.rejected) {
    return t('claimStatusRejected')
  }
  if (status === claimDisplayStatuses.paid) {
    return t('claimStatusPaid')
  }
  if (status === claimDisplayStatuses.partiallyPaid) {
    return t('claimStatusPartiallyPaid')
  }
  if (status === claimDisplayStatuses.denied) {
    return t('claimStatusDenied')
  }
  if (status === claimStatuses.voided) {
    return t('claimStatusVoided')
  }

  return t('claimStatusDraft')
}

function processingStatusLabel(status) {
  if (status === claimStatuses.ready) {
    return t('claimStatusReady')
  }
  if (status === claimStatuses.submitted) {
    return t('claimStatusSubmitted')
  }
  if (status === claimStatuses.accepted) {
    return t('claimStatusAccepted')
  }
  if (status === claimStatuses.rejected) {
    return t('claimStatusRejected')
  }
  if (status === claimStatuses.voided) {
    return t('claimStatusVoided')
  }

  return t('claimStatusDraft')
}

function adjudicationDimensionLabel(status) {
  if (status === claimAdjudicationStatuses.adjudicated) {
    return t('claimAdjudicationAdjudicated')
  }

  return t('claimAdjudicationPending')
}

function denialDimensionLabel(status) {
  if (status === claimDenialStatuses.partial) {
    return t('claimDenialPartial')
  }
  if (status === claimDenialStatuses.full) {
    return t('claimDenialFull')
  }

  return t('claimDenialNone')
}

function payerPaymentDimensionLabel(status) {
  if (status === payerPaymentStatuses.partial) {
    return t('claimPayerPaymentPartial')
  }
  if (status === payerPaymentStatuses.paid) {
    return t('claimPayerPaymentPaid')
  }

  return t('claimPayerPaymentNone')
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
    ROUTE: 'claimCategoryRoute',
    SUBMITTER: 'claimCategorySubmitter',
    RECEIVER: 'claimCategoryReceiver',
    FORMAT: 'claimCategoryFormat',
    CLAIM: 'claimCategoryClaim',
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
    CLAIM_SUBMISSION_CREATED: 'claimHistorySubmissionCreated',
    CLAIM_SUBMITTED: 'claimHistorySubmitted',
    CLAIM_SUBMISSION_FAILED: 'claimHistorySubmissionFailed',
    CLAIM_999_RECEIVED: 'claimHistory999Received',
    CLAIM_277CA_RECEIVED: 'claimHistory277caReceived',
    CLAIM_ACCEPTED: 'claimHistoryAccepted',
    CLAIM_REJECTED: 'claimHistoryRejected',
    CLAIM_ADJUDICATED: 'claimHistoryAdjudicated',
    CLAIM_PAID: 'claimHistoryPaid',
    CLAIM_PARTIALLY_PAID: 'claimHistoryPartiallyPaid',
    CLAIM_DENIED: 'claimHistoryDenied',
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

function relationshipLabel(type) {
  if (type === 'REPLACEMENT') {
    return t('claimRelationshipReplacement')
  }
  if (type === 'CORRECTED') {
    return t('claimRelationshipCorrected')
  }

  return t('claimRelationshipOriginal')
}

function goToClaimId(id) {
  if (!id || String(id) === claimId.value) {
    return
  }
  void router.push({
    name: 'ClaimDetail',
    params: { id: String(id) },
  })
}

function goToDenial(id) {
  if (!id) {
    return
  }
  void router.push({
    name: 'DenialDetail',
    params: { id: String(id) },
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

function goToClientAuthorizations() {
  const id = clientChartKey(detail.value?.patient)
  if (!id) {
    return
  }
  void router.push({
    name: 'EditClient',
    params: { id },
    query: {
      tab: addClientTabKeys.careCoordination,
      subTab: addClientCareCoordinationSubTabKeys.authorizations,
    },
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
  if (check.action === claimRequirementActions.viewAuthorization) {
    goToClientAuthorizations()
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
  if (check.action === claimRequirementActions.viewSubmissionRoute
    || check.action === claimRequirementActions.viewPayerConfiguration) {
    if (canManageSubmissionRoute.value) {
      routeOpen.value = true
      return
    }
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('claimRouteHint'),
    })
    return
  }
  goToSuperbill()
}

function ackLabel(ack) {
  if (!ack) {
    return t('claimAckPending')
  }
  if (ack.result === 'ACCEPTED') {
    return `${t('claimAckReceived')} · ${t('claimAckAccepted')}`
  }
  if (ack.result === 'REJECTED') {
    return `${t('claimAckReceived')} · ${t('claimAckRejected')}`
  }

  return t('claimAckReceived')
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

async function onSubmit() {
  actionBusy.value = true
  try {
    detail.value = await submitClaim(claimId.value, {
      version: detail.value?.version,
    })
    submitOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('claimSubmitSuccess'),
    })
    const history = await fetchClaimHistory(claimId.value)
    historyItems.value = history.items
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: claimApiErrorMessage(
          error,
          t('claimSubmitError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}

async function onRetry() {
  if (!latestSubmission.value?.id) {
    return
  }
  actionBusy.value = true
  try {
    detail.value = await retryClaimSubmission(
      claimId.value,
      latestSubmission.value.id,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('claimRetrySuccess'),
    })
    const history = await fetchClaimHistory(claimId.value)
    historyItems.value = history.items
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: claimApiErrorMessage(
          error,
          t('claimSubmitError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}

async function onRouteSaved() {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('claimRouteSaved'),
  })
  await loadDetail()
}

function onRouteError(message) {
  $q.notify({
    type: quasarNotifyTypes.negative,
    message,
  })
}

watch(claimId, () => {
  void loadDetail()
})

onMounted(() => {
  void loadDetail()
})
</script>
