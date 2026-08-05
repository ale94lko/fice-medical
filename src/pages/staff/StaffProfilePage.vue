<template>
  <q-page
    class="admin-page client-overview-page client-overview-alt-page
      staff-profile-page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
      :surface-opacity="0.5"
    />

    <StaffProfileHeader
      v-if="profile"
      class="client-overview-page__header"
      :staff-id="route.params.id"
      :header="profile"
      :can-edit="canEditStaff"
      :loading="loading"
      @edit="goEdit"
      @close="goBack"
    />
    <ClientOverviewHeaderSkeleton
      v-else
      class="client-overview-page__header"
    />

    <div class="client-overview-page__main client-overview-alt-page__main">
      <StaffProfileTabs
        v-if="profile"
        v-model="activeTab"
        :show-clinical="Boolean(profile.sections.clinical)"
      />

      <div
        class="client-overview-page__body
          client-overview-alt-page__body
          staff-profile-page__body">
        <div
          class="client-overview-alt-page__content
            staff-profile-page__content">
          <StaffProfileSection
            v-if="activeSection"
            :icon="activeSection.icon"
            :title="activeSection.title"
            :fields="activeSection.fields"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ClientOverviewHeaderSkeleton from
  'components/client-overview/ClientOverviewHeaderSkeleton.vue'
import StaffProfileHeader from
  'components/staff/StaffProfileHeader.vue'
import StaffProfileSection from
  'components/staff/StaffProfileSection.vue'
import StaffProfileTabs from 'components/staff/StaffProfileTabs.vue'
import { quasarNotifyTypes, staffEntryPoints } from
  'components/constants.js'
import { useStaffPermissions } from 'src/composables/useStaffPermissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { fetchStaffById } from 'src/utils/staff-api.js'
import { createEmptyStaffForm } from 'src/utils/staff-form.js'
import {
  buildStaffProfileView,
  staffProfileTabKeys,
} from 'src/utils/staff-profile-view.js'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const $q = useQuasar()
const { canEditStaff } = useStaffPermissions()

const loading = ref(false)
const profile = ref(null)
const activeTab = ref(staffProfileTabKeys.basic)

const activeSection = computed(() => {
  const sections = profile.value?.sections
  if (!sections) {
    return null
  }
  const section = sections[activeTab.value]
  if (section) {
    return section
  }

  return sections[staffProfileTabKeys.basic] ?? null
})

watch(
  () => profile.value?.sections?.clinical,
  clinical => {
    if (!clinical && activeTab.value === staffProfileTabKeys.clinical) {
      activeTab.value = staffProfileTabKeys.basic
    }
  },
)

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
    const form = createEmptyStaffForm(
      staffEntryPoints.addStaff,
      data,
    )
    profile.value = buildStaffProfileView(form, {
      id: data?.id ?? route.params.id,
      staffNo: data?.code ?? data?.staff_no ?? data?.staffNo,
      name: data?.name,
    }, t)
    activeTab.value = staffProfileTabKeys.basic
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('staffProfileLoadError'),
      })
    }
    profile.value = null
  } finally {
    loading.value = false
  }
})
</script>
