<template>
  <div class="add-client-insurance-tab">
    <div class="add-client-form__insurance-header row items-start">
      <div class="col">
        <h2 class="add-client-form__insurance-title">
          {{ t('insuranceProfilesTitle') }}
        </h2>
        <p class="add-client-form__insurance-subtitle text-body2">
          {{ t('insuranceProfilesSubtitle') }}
        </p>
      </div>
      <div class="col-auto">
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

    <div class="add-client-form__insurance-table-card q-pa-md q-mt-md">
      <InsuranceProfilesTable
        :profiles="visibleProfiles"
        :empty-label="t('insuranceProfilesEmpty')"
        @view="openView"
        @edit="openEdit"
        @delete="openDelete"
      />
    </div>

    <div class="add-client-form__insurance-info-banner q-mt-md">
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

    <InsuranceDeleteDialog
      v-model="deleteDialogOpen"
      @confirm="onDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import InsuranceDeleteDialog from 'components/InsuranceDeleteDialog.vue'
import InsuranceProfileDialog from 'components/InsuranceProfileDialog.vue'
import InsuranceProfilesTable from 'components/InsuranceProfilesTable.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import {
  createEmptyInsuranceProfile,
  softDeleteInsuranceProfile,
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
const deleteDialogOpen = ref(false)
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

function openDelete(profile) {
  deletingProfile.value = profile
  deleteDialogOpen.value = true
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

function onDeleteConfirm() {
  const profile = deletingProfile.value
  if (!profile) {
    return
  }
  softDeleteInsuranceProfile(profile)
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('insuranceDeletedSuccess'),
    position: 'top',
  })
  deletingProfile.value = null
}
</script>
