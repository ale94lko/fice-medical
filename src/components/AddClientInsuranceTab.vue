<template>
  <div class="add-client-insurance-tab">
    <div
      v-if="!canView"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('insuranceNoPermission') }}
      </p>
    </div>

    <template v-else>
    <div class="insurance-header row items-start">
      <div class="col">
        <h2 class="insurance-title">
          {{ t('insuranceProfilesTitle') }}
        </h2>
        <p
          v-if="!isMobile"
          class="insurance-subtitle text-body2">
          {{ t('insuranceProfilesSubtitle') }}
        </p>
      </div>
      <div
        v-if="!isMobile"
        class="col-auto row items-center no-wrap
          insurance-header__actions q-gutter-md">
        <div class="insurance-show-inactive row items-center no-wrap">
          <span class="insurance-show-inactive__label text-body2">
            {{ t('insuranceShowInactive') }}
          </span>
          <q-icon
            name="info_outline"
            size="16px"
            class="insurance-show-inactive__info cursor-pointer"
            :aria-label="t('insuranceShowInactiveHint')">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('insuranceShowInactiveHint') }}
            </q-tooltip>
          </q-icon>
          <FormToggle
            v-model="showInactiveInsurance"
            :test-id="tid.insuranceShowInactive"
          />
        </div>
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :disable="!canAddInsuranceProfile"
          :data-testid="tid.insuranceBtnAdd"
          :label="t('insuranceAddProfile')"
          @click="openAdd"
        >
          <q-tooltip v-if="!canAddInsuranceProfile">
            {{ t('insuranceMaxActivePriorities') }}
          </q-tooltip>
        </q-btn>
      </div>
      <div
        v-else
        class="col-auto insurance-header__actions
          insurance-header__actions--menu">
        <q-btn
          unelevated
          outline
          no-caps
          color="primary"
          :icon="adminTableActionIcons.more"
          class="app-btn-outline insurance-header__menu-btn"
          :data-testid="tid.insuranceActionsMenu"
          :aria-label="t('moreActions')">
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('moreActions') }}
          </q-tooltip>
          <q-menu
            anchor="bottom right"
            self="top right"
            :offset="[0, 8]"
            class="app-light-menu insurance-header__actions-menu">
            <q-list dense style="min-width: 220px">
              <q-item
                v-if="!readonly"
                v-close-popup
                clickable
                :disable="!canAddInsuranceProfile"
                :data-testid="tid.insuranceBtnAdd"
                @click="openAdd">
                <q-item-section avatar>
                  <q-icon name="add" color="primary" size="18px" />
                </q-item-section>
                <q-item-section>
                  {{ t('insuranceAddProfile') }}
                </q-item-section>
              </q-item>
              <q-item
                clickable
                :data-testid="tid.insuranceShowInactive"
                @click="toggleShowInactiveInsurance">
                <q-item-section avatar>
                  <q-icon
                    name="visibility"
                    color="primary"
                    size="18px"
                  />
                </q-item-section>
                <q-item-section>
                  {{ t('insuranceShowInactive') }}
                </q-item-section>
                <q-item-section side>
                  <FormToggle
                    :model-value="showInactiveInsurance"
                    :test-id="tid.insuranceShowInactiveToggle"
                    @update:model-value="onShowInactiveFromMenu"
                    @click.stop
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </div>

    <AdminTablePanel
      class="insurance-table-panel admin-table-panel--wide q-mt-md"
      :show-column-settings="false">
      <InsuranceProfilesTable
        :profiles="displayProfiles"
        :can-edit="!readonly"
        :empty-label="t('insuranceProfilesEmpty')"
        @view="openView"
        @edit="openEdit"
        @deactivate="openDeactivate"
        @reactivate="openReactivate"
      />
    </AdminTablePanel>

    <div class="insurance-info-banner q-mt-md">
      <q-icon name="info" size="20px" class="q-mr-sm" />
      <span>{{ t('insurancePriorityBillingHint') }}</span>
    </div>

    <InsuranceProfileDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :profile="activeProfile"
      :section="section"
      :patient-name="patientName"
      :client-id="clientId"
      :payer-catalog-items="payerCatalogItems"
      :payer-catalog-loading="payerCatalogLoading"
      :persisting="persistBusy"
      @save="onDialogSave"
    />

    <InsuranceDeactivateDialog
      v-model="deactivateDialogOpen"
      :submitting="lifecycleBusy"
      @confirm="onDeactivateConfirm"
    />

    <ModalComponent
      v-model="reactivateDialogOpen"
      :title="t('insuranceReactivateTitle')"
      :message="reactivateMessage"
      :confirm-text="t('insuranceReactivateConfirm')"
      :cancel-text="t('cancel')"
      test-id="insurance-reactivate"
      @confirm="onReactivateConfirm"
    />
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import InsuranceDeactivateDialog from
  'components/InsuranceDeactivateDialog.vue'
import InsuranceProfileDialog from 'components/InsuranceProfileDialog.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import FormToggle from 'components/FormToggle.vue'
import InsuranceProfilesTable from 'components/InsuranceProfilesTable.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { useViewportLayout } from 'src/composables/useViewportLayout.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import {
  applyLocalInsuranceDeactivation,
  applyLocalInsuranceReactivation,
  areAllActiveInsurancePrioritiesTaken,
  canDeactivateInsuranceProfile,
  canReactivateInsuranceProfile,
  createEmptyInsuranceProfile,
  deriveInsuranceStatusFromDates,
  findOccupyingInsuranceByPriority,
  insuranceRowHasPersistedApiId,
  isInsuranceProfileInactive,
  listInsuranceProfilesForDisplay,
} from 'src/utils/client-insurance.js'
import {
  createInsuranceProfile,
  deactivateInsuranceProfile as deactivateInsuranceProfileApi,
  insuranceApiErrorMessage,
  reactivateInsuranceProfile as reactivateInsuranceProfileApi,
  updateInsuranceProfile,
} from 'src/utils/insurance-api.js'
import { insuranceProfileToApiPayload } from
  'src/utils/build-client-register-clinical.js'
import { mapInsuranceProfileFromApi } from
  'src/utils/map-client-api-to-form.js'

const props = defineProps({
  patientName: {
    type: String,
    default: '',
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
  payerCatalogItems: {
    type: Array,
    default: () => [],
  },
  payerCatalogLoading: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  canView: {
    type: Boolean,
    default: true,
  },
})

const section = defineModel({
  type: Object,
  required: true,
})

const { t } = useI18n()
const $q = useQuasar()
const { isMobile } = useViewportLayout()

const dialogOpen = ref(false)
const dialogMode = ref('add')
const activeProfile = ref(null)
const deactivateDialogOpen = ref(false)
const reactivateDialogOpen = ref(false)
const lifecycleProfile = ref(null)
const occupyingPriorityProfile = ref(null)
const lifecycleBusy = ref(false)
const persistBusy = ref(false)
const showInactiveInsurance = ref(false)

const displayProfiles = computed(() =>
  listInsuranceProfilesForDisplay(section.value, {
    showInactive: showInactiveInsurance.value,
  }),
)

const canAddInsuranceProfile = computed(
  () => !areAllActiveInsurancePrioritiesTaken(section.value),
)

const reactivateMessage = computed(() => {
  const occupying = occupyingPriorityProfile.value
  if (occupying?.priority) {
    return t('insuranceReactivatePrioritySwapMessage', {
      priority: occupying.priority,
    })
  }

  return t('insuranceReactivateMessage')
})

function toggleShowInactiveInsurance() {
  showInactiveInsurance.value = !showInactiveInsurance.value
}

function onShowInactiveFromMenu(value) {
  showInactiveInsurance.value = Boolean(value)
}

function hasPersistedClient() {
  const id = props.clientId

  return id != null && String(id).trim() !== ''
}

function replaceProfileInSection(nextProfile) {
  const profiles = [...(section.value.profiles ?? [])]
  const idx = profiles.findIndex(item => item.id === nextProfile.id)
  if (idx >= 0) {
    profiles[idx] = nextProfile
  } else {
    profiles.push(nextProfile)
  }
  section.value = {
    ...section.value,
    profiles,
  }
}

function mergeLifecycleFromApi(existing, apiRow) {
  if (!apiRow || typeof apiRow !== 'object') {
    return existing
  }
  const mapped = mapInsuranceProfileFromApi(
    apiRow?.insurance_profile
    ?? apiRow?.insuranceProfile
    ?? apiRow?.profile
    ?? apiRow,
  )

  return {
    ...mapped,
    id: existing.id,
    payerId: existing.payerId ?? mapped.payerId,
    cardFilesByKind: mapped.cardFilesByKind
      ?? existing.cardFilesByKind,
  }
}

function openAdd() {
  if (!canAddInsuranceProfile.value) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('insuranceMaxActivePriorities'),
      position: 'top',
    })

    return
  }
  dialogMode.value = 'add'
  activeProfile.value = createEmptyInsuranceProfile()
  dialogOpen.value = true
}

function openView(profile) {
  dialogMode.value = 'view'
  activeProfile.value = profile
  dialogOpen.value = true
}

function openEdit(profile) {
  if (isInsuranceProfileInactive(profile)) {
    openView(profile)

    return
  }
  dialogMode.value = 'edit'
  activeProfile.value = profile
  dialogOpen.value = true
}

function openDeactivate(profile) {
  if (!canDeactivateInsuranceProfile(profile)) {
    return
  }
  lifecycleProfile.value = profile
  deactivateDialogOpen.value = true
}

function openReactivate(profile) {
  if (!canReactivateInsuranceProfile(profile)) {
    return
  }
  lifecycleProfile.value = profile
  occupyingPriorityProfile.value = findOccupyingInsuranceByPriority(
    section.value,
    profile.priority,
    profile.id,
  )
  reactivateDialogOpen.value = true
}

function applyLocalInsuranceSave(profile) {
  const next = {
    ...profile,
    status: deriveInsuranceStatusFromDates(profile),
  }
  replaceProfileInSection(next)
  dialogOpen.value = false
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: dialogMode.value === 'edit'
      ? t('insuranceUpdatedSuccess')
      : t('insuranceAddedSuccess'),
    position: 'top',
  })
}

async function persistInsuranceToApi(profile) {
  const payload = insuranceProfileToApiPayload(profile)
  const apiRow = insuranceRowHasPersistedApiId(profile)
    ? await updateInsuranceProfile(
      props.clientId,
      profile.apiId,
      payload,
    )
    : await createInsuranceProfile(props.clientId, payload)

  return mergeLifecycleFromApi(profile, apiRow)
}

async function onDialogSave(profile) {
  if (!hasPersistedClient()) {
    applyLocalInsuranceSave(profile)

    return
  }
  persistBusy.value = true
  try {
    const next = await persistInsuranceToApi(profile)
    replaceProfileInSection(next)
    dialogOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: dialogMode.value === 'edit'
        ? t('insuranceUpdatedSuccess')
        : t('insuranceAddedSuccess'),
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: insuranceApiErrorMessage(
        error,
        t('insuranceSaveError'),
      ),
      position: 'top',
    })
  } finally {
    persistBusy.value = false
  }
}

async function onDeactivateConfirm({ reason, notes }) {
  const profile = lifecycleProfile.value
  if (!profile) {
    return
  }
  const payload = { reason, notes }
  lifecycleBusy.value = true
  try {
    if (
      hasPersistedClient()
      && insuranceRowHasPersistedApiId(profile)
    ) {
      const apiRow = await deactivateInsuranceProfileApi(
        props.clientId,
        profile.apiId,
        payload,
      )
      replaceProfileInSection(mergeLifecycleFromApi(profile, apiRow))
      if (!showInactiveInsurance.value) {
        showInactiveInsurance.value = true
      }
    } else {
      const next = { ...profile }
      applyLocalInsuranceDeactivation(next, payload)
      replaceProfileInSection(next)
      if (!showInactiveInsurance.value) {
        showInactiveInsurance.value = true
      }
    }
    deactivateDialogOpen.value = false
    lifecycleProfile.value = null
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('insuranceDeactivatedSuccess'),
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: insuranceApiErrorMessage(
        error,
        t('insuranceDeactivateError'),
      ),
      position: 'top',
    })
  } finally {
    lifecycleBusy.value = false
  }
}

async function deactivateOccupyingForSwap(occupying) {
  const payload = {
    reason: 'DUPLICATE_INSURANCE',
    notes: null,
  }
  if (
    hasPersistedClient()
    && insuranceRowHasPersistedApiId(occupying)
  ) {
    const apiRow = await deactivateInsuranceProfileApi(
      props.clientId,
      occupying.apiId,
      payload,
    )
    replaceProfileInSection(mergeLifecycleFromApi(occupying, apiRow))

    return
  }
  const next = { ...occupying }
  applyLocalInsuranceDeactivation(next, payload)
  replaceProfileInSection(next)
}

async function onReactivateConfirm() {
  const profile = lifecycleProfile.value
  if (!profile) {
    return
  }
  lifecycleBusy.value = true
  try {
    const occupying = occupyingPriorityProfile.value
    if (occupying) {
      await deactivateOccupyingForSwap(occupying)
      showInactiveInsurance.value = true
    }
    if (
      hasPersistedClient()
      && insuranceRowHasPersistedApiId(profile)
    ) {
      const apiRow = await reactivateInsuranceProfileApi(
        props.clientId,
        profile.apiId,
      )
      replaceProfileInSection(mergeLifecycleFromApi(profile, apiRow))
    } else {
      const next = { ...profile }
      applyLocalInsuranceReactivation(next)
      replaceProfileInSection(next)
    }
    reactivateDialogOpen.value = false
    lifecycleProfile.value = null
    occupyingPriorityProfile.value = null
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('insuranceReactivatedSuccess'),
      position: 'top',
    })
  } catch (error) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: insuranceApiErrorMessage(
        error,
        t('insuranceReactivateError'),
      ),
      position: 'top',
    })
  } finally {
    lifecycleBusy.value = false
  }
}
</script>
