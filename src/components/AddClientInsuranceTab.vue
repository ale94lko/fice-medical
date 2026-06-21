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
        <p class="insurance-subtitle text-body2">
          {{ t('insuranceProfilesSubtitle') }}
        </p>
      </div>
      <div v-if="!readonly" class="col-auto">
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :data-testid="tid.insuranceBtnAdd"
          :label="t('insuranceAddProfile')"
          @click="openAdd"
        />
      </div>
    </div>

    <AdminTablePanel
      class="insurance-table-panel q-mt-md"
      :show-column-settings="false">
      <InsuranceProfilesTable
        :profiles="visibleProfiles"
        :can-edit="!readonly"
        :empty-label="t('insuranceProfilesEmpty')"
        @view="openView"
        @edit="openEdit"
        @deactivate="openDeactivate"
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
      :payer-catalog-items="payerCatalogItems"
      :payer-catalog-loading="payerCatalogLoading"
      @save="onDialogSave"
    />

    <InsuranceDeactivateDialog
      v-model="deactivateDialogOpen"
      @confirm="onDeactivateConfirm"
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
import InsuranceProfilesTable from 'components/InsuranceProfilesTable.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import {
  createEmptyInsuranceProfile,
  deactivateInsuranceProfile,
  visibleInsuranceProfiles,
} from 'src/utils/client-insurance.js'

defineProps({
  patientName: {
    type: String,
    default: '',
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

const dialogOpen = ref(false)
const dialogMode = ref('add')
const activeProfile = ref(null)
const deactivateDialogOpen = ref(false)
const deletingProfile = ref(null)

const visibleProfiles = computed(() =>
  visibleInsuranceProfiles(section.value),
)

function openAdd() {
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
  dialogMode.value = 'edit'
  activeProfile.value = profile
  dialogOpen.value = true
}

function openDeactivate(profile) {
  deletingProfile.value = profile
  deactivateDialogOpen.value = true
}

function onDialogSave(profile) {
  const profiles = [...(section.value.profiles ?? [])]
  const idx = profiles.findIndex(item => item.id === profile.id)
  if (idx >= 0) {
    profiles[idx] = profile
  } else {
    profiles.push(profile)
  }
  section.value = {
    ...section.value,
    profiles,
  }
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: dialogMode.value === 'edit'
      ? t('insuranceUpdatedSuccess')
      : t('insuranceAddedSuccess'),
    position: 'top',
  })
}

function onDeactivateConfirm(reason) {
  const profile = deletingProfile.value
  if (!profile || !String(reason ?? '').trim()) {
    return
  }
  deactivateInsuranceProfile(profile, reason)
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('insuranceDeactivatedSuccess'),
    position: 'top',
  })
  deletingProfile.value = null
}
</script>
