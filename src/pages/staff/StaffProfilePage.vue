<template>
  <q-page class="admin-page staff-profile-page">
    <AppLoadingOverlay scope="content" :showing="loading" />

    <AdminListPageHeader
      :title="profileTitle"
      :subtitle="profileSubtitle">
      <template #actions>
        <q-btn
          v-if="canEditStaff"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="edit_note"
          :label="t('edit')"
          @click="goEdit"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('close')"
          @click="goBack"
        />
      </template>
    </AdminListPageHeader>

    <q-card flat bordered class="q-mt-md">
      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('staffListColStaffNo') }}
            </p>
            <p class="text-body1 q-mb-md">
              {{ staffNo || '—' }}
            </p>
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('email') }}
            </p>
            <p class="text-body1 q-mb-md">
              {{ email || '—' }}
            </p>
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('staffListColPosition') }}
            </p>
            <p class="text-body1 q-mb-md">
              {{ position || '—' }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('status') }}
            </p>
            <AdminTableStatusCell
              v-if="statusLabel"
              :label="statusLabel"
              :variant="statusVariant"
            />
            <p v-else class="text-body1">—</p>
            <p class="text-caption text-grey-7 q-mb-xs q-mt-md">
              {{ t('staffListColHireDate') }}
            </p>
            <p class="text-body1 q-mb-md">
              {{ hireDate || '—' }}
            </p>
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('staffListColClinician') }}
            </p>
            <p class="text-body1">
              {{
                isClinician
                  ? t('staffListClinicianYes')
                  : '—'
              }}
            </p>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { useStaffPermissions } from 'src/composables/useStaffPermissions.js'
import { fetchStaffById } from 'src/utils/staff-api.js'
import { mapStaffListItem } from 'src/utils/staff-list-normalize.js'
import { staffFieldKeys as fk } from 'src/utils/staff-list-columns.js'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { canEditStaff } = useStaffPermissions()

const loading = ref(false)
const record = ref(null)

const profileTitle = computed(() =>
  record.value?.[fk.name] ?? t('staffProfile'),
)

const profileSubtitle = computed(() =>
  record.value?.[fk.staffNo] ?? '',
)

const staffNo = computed(() => record.value?.[fk.staffNo] ?? '')
const email = computed(() => record.value?.[fk.email] ?? '')
const position = computed(() => record.value?.[fk.position] ?? '')
const hireDate = computed(() => record.value?.[fk.hireDate] ?? '')
const statusLabel = computed(() => record.value?.[fk.status] ?? '')
const statusVariant = computed(() => record.value?.statusVariant ?? 'other')
const isClinician = computed(() => Boolean(record.value?.[fk.isClinician]))

function goBack() {
  router.push('/staff')
}

function goEdit() {
  router.push({
    name: 'EditStaff',
    params: { id: route.params.id },
  })
}

onMounted(async() => {
  loading.value = true
  try {
    const data = await fetchStaffById(route.params.id)
    record.value = mapStaffListItem({
      id: data.id,
      // eslint-disable-next-line camelcase -- API list item shape
      staff_no: data.code ?? data.staff_no,
      name: data.name,
      email: data.email,
      position: data.employment?.position,
      status: data.employment?.status,
      // eslint-disable-next-line camelcase -- API list item shape
      hire_date: data.employment?.hire,
      // eslint-disable-next-line camelcase -- API list item shape
      is_clinician: Boolean(data.clinician ?? data.clinical_profile),
    }, t)
  } finally {
    loading.value = false
  }
})
</script>
