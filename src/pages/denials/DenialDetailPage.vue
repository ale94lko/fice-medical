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
                {{ t('denialTitle', {
                  number: detail.denialNumber || detail.id,
                }) }}
              </h1>
              <AdminTableStatusCell
                :label="statusLabel(detail.status)"
                :variant="denialStatusVariant(detail.status)"
              />
            </div>
            <p class="superbill-detail__subtitle q-mb-none">
              {{ detail.claimNumber }} · {{ detail.clientName }}
            </p>
            <p class="text-caption text-grey-7 q-mb-none">
              {{ issueTypeLabel(detail.sourceType) }}
              · {{ categoryLabel(detail.category) }}
            </p>
          </div>
          <div class="superbill-detail__actions no-print">
            <q-btn
              v-if="canStartWork"
              no-caps
              unelevated
              color="primary"
              class="app-btn-primary"
              :data-testid="tid.startWork"
              :label="t('denialStartWork')"
              @click="onStartWork"
            />
            <q-btn
              v-if="canCorrectAction"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid.correct"
              :label="correctLabel"
              @click="correctOpen = true"
            />
            <q-btn
              v-if="canAppealAction"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid.appeal"
              :label="t('denialCreateAppeal')"
              @click="appealOpen = true"
            />
            <q-btn
              v-if="canResolveAction"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid.resolve"
              :label="t('denialResolve')"
              @click="resolveOpen = true"
            />
            <q-btn
              v-if="detail.claimId"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid.viewClaim"
              :label="t('denialViewClaim')"
              @click="goToClaim"
            />
          </div>
        </div>
      </div>

      <div class="superbill-detail__layout">
        <div class="superbill-detail__main">
          <section class="superbill-detail__card">
            <h2>{{ t('denialPayerResponse') }}</h2>
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('denialSource') }}</dt>
                <dd>{{ sourceLabel }}</dd>
              </div>
              <div v-if="detail.reasonCode">
                <dt>{{ reasonCodeLabel }}</dt>
                <dd>{{ detail.reasonCode }}</dd>
              </div>
              <div v-if="detail.remarkCode">
                <dt>{{ t('denialRarc') }}</dt>
                <dd>{{ detail.remarkCode }}</dd>
              </div>
              <div v-if="detail.groupCode">
                <dt>{{ t('denialGroupCode') }}</dt>
                <dd>{{ detail.groupCode }}</dd>
              </div>
              <div>
                <dt>{{ t('denialPayerMessage') }}</dt>
                <dd>{{ detail.payerMessage || '—' }}</dd>
              </div>
            </dl>
          </section>

          <section class="superbill-detail__card q-mt-lg">
            <h2>{{ t('denialAffectedService') }}</h2>
            <p v-if="!detail.procedureCode" class="q-mb-none">
              {{ t('denialEntireClaim') }}
            </p>
            <dl v-else class="superbill-detail__facts">
              <div>
                <dt>{{ t('denialColumnService') }}</dt>
                <dd>
                  {{ detail.procedureCode }}
                  {{ detail.serviceName
                    ? `· ${detail.serviceName}` : '' }}
                </dd>
              </div>
              <div>
                <dt>{{ t('denialBilled') }}</dt>
                <dd>{{ detail.billedAmountLabel }}</dd>
              </div>
              <div>
                <dt>{{ t('denialPaid') }}</dt>
                <dd>{{ detail.payerPaidAmountLabel }}</dd>
              </div>
              <div>
                <dt>{{ t('denialColumnAmount') }}</dt>
                <dd>{{ detail.deniedAmountLabel }}</dd>
              </div>
            </dl>
          </section>

          <section class="superbill-detail__card q-mt-lg">
            <h2>{{ t('denialRootCauseSection') }}</h2>
            <p class="text-body2 text-grey-7">
              {{ t('denialRootCauseHint') }}
            </p>
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('denialColumnCategory') }}</dt>
                <dd>{{ categoryLabel(detail.category) }}</dd>
              </div>
              <div>
                <dt>{{ t('denialRootCause') }}</dt>
                <dd>{{ detail.rootCause || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('denialNotes') }}</dt>
                <dd>{{ detail.notes || '—' }}</dd>
              </div>
            </dl>
            <div
              v-if="canWork && !isTerminal"
              class="row q-col-gutter-md q-mt-md">
              <div class="col-12 col-md-6">
                <FormField :label="t('denialColumnCategory')">
                  <FormSelect
                    v-model="editCategory"
                    :options="categoryOptions"
                    emit-value
                    map-options
                    :clearable="false"
                  />
                </FormField>
              </div>
              <div class="col-12">
                <FormField :label="t('denialRootCause')">
                  <TextInput
                    v-model="editRootCause"
                    :external-label="true"
                  />
                </FormField>
              </div>
              <div class="col-12">
                <q-btn
                  no-caps
                  unelevated
                  color="primary"
                  class="app-btn-primary"
                  :data-testid="tid.saveRootCause"
                  :label="t('save')"
                  @click="onSaveRootCause"
                />
              </div>
            </div>
          </section>

          <section class="superbill-detail__card q-mt-lg">
            <h2>{{ t('denialSuggestedActions') }}</h2>
            <div class="row q-gutter-sm">
              <q-btn
                v-if="detail.suggestedAction"
                no-caps
                outline
                color="primary"
                class="app-btn-outline"
                :data-testid="tid.suggestedAction"
                :label="suggestedActionLabel"
                @click="onSuggestedAction"
              />
              <q-btn
                v-if="canCorrect && detail.superbillId"
                no-caps
                outline
                color="primary"
                class="app-btn-outline"
                :data-testid="tid.reopenSource"
                :label="t('denialReopenSource')"
                @click="onReopenSource"
              />
            </div>
          </section>

          <section
            v-if="detail.appeals?.length"
            class="superbill-detail__card q-mt-lg">
            <h2>{{ t('denialAppeals') }}</h2>
            <ul class="superbill-detail__history">
              <li
                v-for="appeal in detail.appeals"
                :key="appeal.id">
                <strong>
                  {{ appeal.appealNumber }} · {{ appeal.status }}
                </strong>
                <span>{{ appeal.reason || appeal.narrative }}</span>
              </li>
            </ul>
          </section>
        </div>

        <aside class="superbill-detail__side">
          <section class="superbill-detail__card">
            <dl class="superbill-detail__facts">
              <div>
                <dt>{{ t('claimColumnNumber') }}</dt>
                <dd>{{ detail.claimNumber || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimColumnStatus') }}</dt>
                <dd>{{ detail.claimStatus || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimMetaClient') }}</dt>
                <dd>{{ detail.clientName || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimMetaPayer') }}</dt>
                <dd>{{ detail.payerName || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('claimMetaDos') }}</dt>
                <dd>{{ detail.dateOfServiceDisplay || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('denialColumnAmount') }}</dt>
                <dd>{{ detail.deniedAmountLabel }}</dd>
              </div>
              <div>
                <dt>{{ t('denialColumnPriority') }}</dt>
                <dd>{{ detail.priority }}</dd>
              </div>
              <div>
                <dt>{{ t('denialColumnFollowUp') }}</dt>
                <dd>{{ detail.followUpDateDisplay || '—' }}</dd>
              </div>
              <div v-if="detail.correctedClaimNumber">
                <dt>{{ t('denialCorrectedClaim') }}</dt>
                <dd>
                  <button
                    type="button"
                    class="admin-data-table__link"
                    @click="goToCorrected">
                    {{ detail.correctedClaimNumber }}
                  </button>
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </template>

    <div
      v-else-if="!loading"
      class="superbill-detail__empty">
      {{ loadError || t('denialLoadError') }}
    </div>

    <q-dialog
      v-model="correctOpen"
      persistent
      transition-show="scale"
      transition-hide="scale">
      <q-card class="insurance-dialog app-dialog-card
        app-dialog-card--sm">
        <AppDialogHeader
          test-id="denial-detail-dialog-correct"
          @close="correctOpen = false">
          {{ correctLabel }}
        </AppDialogHeader>
        <q-card-section class="app-dialog-card__body
          q-px-lg q-pt-md q-pb-md">
          <p class="text-body2 text-grey-7 q-mb-md">
            {{ t('denialCorrectHint') }}
          </p>
          <FormField
            required
            :label="t('denialCorrectionReason')">
            <FormSelect
              v-model="correctionReason"
              :options="reasonOptions"
              emit-value
              map-options
              :clearable="false"
            />
          </FormField>
          <FormField
            spaced
            :label="t('denialNotes')">
            <TextInput
              v-model="correctionNotes"
              :external-label="true"
            />
          </FormField>
        </q-card-section>
        <q-card-actions
          align="right"
          class="app-dialog-card__actions">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('cancel')"
            :data-testid="tid.dialogCancel('correct')"
            @click="correctOpen = false"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="actionBusy"
            :label="t('denialCreateClaim')"
            :data-testid="tid.dialogConfirm('correct')"
            @click="onCorrect"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="appealOpen"
      persistent
      transition-show="scale"
      transition-hide="scale">
      <q-card class="insurance-dialog app-dialog-card
        app-dialog-card--sm">
        <AppDialogHeader
          test-id="denial-detail-dialog-appeal"
          @close="appealOpen = false">
          {{ t('denialCreateAppeal') }}
        </AppDialogHeader>
        <q-card-section class="app-dialog-card__body
          q-px-lg q-pt-md q-pb-md">
          <FormField
            required
            :label="t('denialAppealReason')">
            <TextInput
              v-model="appealReason"
              :external-label="true"
            />
          </FormField>
          <FormField
            spaced
            :label="t('denialAppealNarrative')">
            <TextInput
              v-model="appealNarrative"
              :external-label="true"
            />
          </FormField>
        </q-card-section>
        <q-card-actions
          align="right"
          class="app-dialog-card__actions">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('cancel')"
            :data-testid="tid.dialogCancel('appeal')"
            @click="appealOpen = false"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="actionBusy"
            :label="t('denialCreateAppeal')"
            :data-testid="tid.dialogConfirm('appeal')"
            @click="onCreateAppeal"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="resolveOpen"
      persistent
      transition-show="scale"
      transition-hide="scale">
      <q-card class="insurance-dialog app-dialog-card
        app-dialog-card--sm">
        <AppDialogHeader
          test-id="denial-detail-dialog-resolve"
          @close="resolveOpen = false">
          {{ t('denialResolve') }}
        </AppDialogHeader>
        <q-card-section class="app-dialog-card__body
          q-px-lg q-pt-md q-pb-md">
          <FormField
            required
            :label="t('denialResolutionType')">
            <FormSelect
              v-model="resolutionType"
              :options="resolutionOptions"
              emit-value
              map-options
              :clearable="false"
            />
          </FormField>
          <FormField
            v-if="resolutionType === 'WRITE_OFF'"
            spaced
            :label="t('denialWriteOffReference')">
            <TextInput
              v-model="writeOffReference"
              :external-label="true"
            />
          </FormField>
          <FormField
            spaced
            :label="t('denialNotes')">
            <TextInput
              v-model="resolutionNotes"
              :external-label="true"
            />
          </FormField>
        </q-card-section>
        <q-card-actions
          align="right"
          class="app-dialog-card__actions">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('cancel')"
            :data-testid="tid.dialogCancel('resolve')"
            @click="resolveOpen = false"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="actionBusy"
            :label="t('denialResolve')"
            :data-testid="tid.dialogConfirm('resolve')"
            @click="onResolve"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  claimCorrectionReasons,
  claimCorrectionTypes,
  claimRequirementActions,
  denialCaseStatuses,
  denialResolutionTypes,
  quasarNotifyTypes,
} from 'components/constants.js'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import TextInput from 'components/TextInput.vue'
import { useDenialPermissions } from
  'src/composables/useDenialPermissions.js'
import { useSyncAppPageTitle } from
  'src/composables/useSyncAppPageTitle.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  correctDenial,
  createDenialAppeal,
  denialApiErrorMessage,
  fetchDenialById,
  requestDenialSourceReopen,
  resolveDenial,
  updateDenial,
} from 'src/utils/denial-api.js'
import { denialStatusVariant } from 'src/utils/denial-work-queue.js'
import { denialDetailTestIds as tid } from 'src/test-ids/index.js'
import { useAuthStore } from 'src/stores/auth-store.js'

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const {
  canWork,
  canAssign,
  canCorrect,
  canReplace,
  canAppeal,
  canResolve,
  canWriteOff,
} = useDenialPermissions()

const loading = ref(false)
const actionBusy = ref(false)
const loadError = ref('')
const detail = ref(null)
const correctOpen = ref(false)
const appealOpen = ref(false)
const resolveOpen = ref(false)
const editCategory = ref('')
const editRootCause = ref('')
const correctionReason = ref(
  claimCorrectionReasons.insuranceInformation,
)
const correctionNotes = ref('')
const appealReason = ref('')
const appealNarrative = ref('')
const resolutionType = ref(
  denialResolutionTypes.noAction,
)
const writeOffReference = ref('')
const resolutionNotes = ref('')

const denialId = computed(() =>
  String(route.params.id ?? '').trim(),
)

useSyncAppPageTitle(computed(() =>
  t('denialTitle', {
    number: detail.value?.denialNumber || denialId.value,
  })))

const isTerminal = computed(() =>
  detail.value?.status === denialCaseStatuses.resolved
  || detail.value?.status === denialCaseStatuses.closedNoAction,
)

const canStartWork = computed(() =>
  canWork.value
  && detail.value?.status === denialCaseStatuses.needsReview,
)

const isRejection = computed(() =>
  detail.value?.sourceType === 'REJECTION',
)

const canCorrectAction = computed(() => {
  if (isTerminal.value) {
    return false
  }
  if (isRejection.value) {
    return canCorrect.value
  }

  return canReplace.value
})

const canAppealAction = computed(() =>
  canAppeal.value && !isTerminal.value && !isRejection.value,
)

const canResolveAction = computed(() =>
  canResolve.value && !isTerminal.value,
)

const correctLabel = computed(() =>
  isRejection.value
    ? t('denialCorrectClaim')
    : t('denialCreateReplacement'),
)

const sourceLabel = computed(() =>
  isRejection.value
    ? t('denialSource277ca')
    : t('denialSource835'),
)

const reasonCodeLabel = computed(() =>
  isRejection.value
    ? t('denialRejectionCode')
    : t('denialCarc'),
)

const suggestedActionLabel = computed(() => {
  const action = detail.value?.suggestedAction
  if (action === claimRequirementActions.viewInsurance) {
    return t('denialReviewInsurance')
  }
  if (action === claimRequirementActions.viewProvider) {
    return t('denialReviewProvider')
  }
  if (action === claimRequirementActions.viewSuperbill) {
    return t('denialReviewSuperbill')
  }
  if (action === claimRequirementActions.viewAuthorization) {
    return t('denialReviewAuthorization')
  }
  if (action === claimRequirementActions.viewClient) {
    return t('denialReviewClient')
  }

  return t('denialReviewClaim')
})

const categoryOptions = computed(() => [
  'ELIGIBILITY', 'AUTHORIZATION', 'PATIENT_INFORMATION',
  'SUBSCRIBER_INFORMATION', 'PAYER_INFORMATION',
  'PROVIDER_INFORMATION', 'CREDENTIALING', 'CODING',
  'DIAGNOSIS', 'SERVICE', 'MODIFIER', 'DUPLICATE',
  'TIMELY_FILING', 'MEDICAL_NECESSITY', 'NON_COVERED_SERVICE',
  'COORDINATION_OF_BENEFITS', 'DOCUMENTATION', 'OTHER',
].map(value => ({
  value,
  label: t(`denialCategory.${value}`),
})))

const reasonOptions = computed(() =>
  Object.values(claimCorrectionReasons).map(value => ({
    value,
    label: t(`denialCorrectionReason.${value}`),
  })),
)

const resolutionOptions = computed(() => {
  const types = [
    denialResolutionTypes.correctedAndResubmitted,
    denialResolutionTypes.replacementClaimSubmitted,
    denialResolutionTypes.appealSubmitted,
    denialResolutionTypes.paidAfterReprocessing,
    denialResolutionTypes.clientResponsibility,
    denialResolutionTypes.noAction,
    denialResolutionTypes.other,
  ]
  if (canWriteOff.value) {
    types.splice(4, 0, denialResolutionTypes.writeOff)
  }

  return types.map(value => ({
    value,
    label: t(`denialResolution.${value}`),
  }))
})

watch(() => detail.value?.category, value => {
  editCategory.value = value || 'OTHER'
})
watch(() => detail.value?.rootCause, value => {
  editRootCause.value = value || ''
})

onMounted(() => {
  loadDetail()
})

async function loadDetail() {
  loading.value = true
  loadError.value = ''
  try {
    detail.value = await fetchDenialById(denialId.value)
  } catch (error) {
    loadError.value = denialApiErrorMessage(
      error,
      t('denialLoadError'),
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

function statusLabel(status) {
  return status ? t(`denialStatus.${status}`) : '—'
}

function categoryLabel(category) {
  return category ? t(`denialCategory.${category}`) : '—'
}

function issueTypeLabel(sourceType) {
  return sourceType === 'REJECTION'
    ? t('denialSourceRejection')
    : t('denialSourceDenial')
}

async function onStartWork() {
  const userId = authStore.userInfo?.id
  try {
    actionBusy.value = true
    const payload = {
      version: detail.value.version,
      status: denialCaseStatuses.inProgress,
    }
    if (canAssign.value && userId) {
      payload['assigned_to'] = userId
    }
    detail.value = await updateDenial(denialId.value, payload)
  } catch (error) {
    notifyError(error, t('denialUpdateError'))
  } finally {
    actionBusy.value = false
  }
}

async function onSaveRootCause() {
  try {
    actionBusy.value = true
    detail.value = await updateDenial(denialId.value, {
      version: detail.value.version,
      category: editCategory.value,
      'root_cause': editRootCause.value,
    })
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('denialSaved'),
    })
  } catch (error) {
    notifyError(error, t('denialUpdateError'))
  } finally {
    actionBusy.value = false
  }
}

async function onCorrect() {
  try {
    actionBusy.value = true
    const type = isRejection.value
      ? claimCorrectionTypes.correctRejectedClaim
      : claimCorrectionTypes.replacementClaim
    detail.value = await correctDenial(denialId.value, {
      version: detail.value.version,
      'correction_type': type,
      'correction_reason': correctionReason.value,
      notes: correctionNotes.value || undefined,
    })
    correctOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('denialCorrectSuccess'),
    })
  } catch (error) {
    notifyError(error, t('denialCorrectError'))
  } finally {
    actionBusy.value = false
  }
}

async function onCreateAppeal() {
  try {
    actionBusy.value = true
    detail.value = await createDenialAppeal(denialId.value, {
      reason: appealReason.value,
      narrative: appealNarrative.value || undefined,
    })
    appealOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('denialAppealSuccess'),
    })
  } catch (error) {
    notifyError(error, t('denialAppealError'))
  } finally {
    actionBusy.value = false
  }
}

async function onResolve() {
  try {
    actionBusy.value = true
    detail.value = await resolveDenial(denialId.value, {
      version: detail.value.version,
      'resolution_type': resolutionType.value,
      'write_off_reference': writeOffReference.value || undefined,
      notes: resolutionNotes.value || undefined,
    })
    resolveOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('denialResolveSuccess'),
    })
  } catch (error) {
    notifyError(error, t('denialResolveError'))
  } finally {
    actionBusy.value = false
  }
}

async function onReopenSource() {
  try {
    actionBusy.value = true
    detail.value = await requestDenialSourceReopen(denialId.value, {
      reason: 'Denial source correction',
      'denial_case_id': detail.value.id,
    })
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('denialReopenSourceSuccess'),
    })
    if (detail.value.superbillId) {
      router.push({
        name: 'SuperbillDetail',
        params: { id: detail.value.superbillId },
      })
    }
  } catch (error) {
    notifyError(error, t('denialReopenSourceError'))
  } finally {
    actionBusy.value = false
  }
}

function onSuggestedAction() {
  const action = detail.value?.suggestedAction
  if (action === claimRequirementActions.viewSuperbill
    && detail.value.superbillId) {
    router.push({
      name: 'SuperbillDetail',
      params: { id: detail.value.superbillId },
    })
    return
  }
  if (detail.value.claimId) {
    router.push({
      name: 'ClaimDetail',
      params: { id: detail.value.claimId },
    })
  }
}

function goToClaim() {
  if (!detail.value?.claimId) {
    return
  }
  router.push({
    name: 'ClaimDetail',
    params: { id: detail.value.claimId },
  })
}

function goToCorrected() {
  if (!detail.value?.correctedClaimId) {
    return
  }
  router.push({
    name: 'ClaimDetail',
    params: { id: detail.value.correctedClaimId },
  })
}

function notifyError(error, fallback) {
  if (isAuthSessionEndUIError(error)) {
    return
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: denialApiErrorMessage(error, fallback),
  })
}
</script>
