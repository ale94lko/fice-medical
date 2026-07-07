<template>
  <q-page
    class="admin-page my-profile-page"
    :data-testid="myProfileTestIds.page">
    <AppLoadingOverlay scope="content" :showing="loading" />

    <AdminListPageHeader
      :title="t('myProfilePageTitle')"
      :subtitle="t('myProfilePageSubtitle')"
    />

    <MyProfileSummaryCard
      v-if="profile"
      class="my-profile-page__summary"
      :profile="profile"
    />

    <div
      v-if="profile"
      class="my-profile-page__content row q-col-gutter-md">
      <div class="col-12 col-lg-8">
        <section class="my-profile-card my-profile-card--tabs">
          <div class="chrome">
            <div class="tabs-row">
              <q-tabs
                v-model="activeTab"
                dense
                no-caps
                class="add-client-tabs"
                active-color="white"
                indicator-color="transparent"
                align="left">
                <q-tab
                  v-for="tab in tabs"
                  :key="tab.key"
                  :name="tab.key"
                  :data-testid="myProfileTestIds.tab(tab.key)">
                  <span class="label row items-center no-wrap">
                    <q-icon
                      :name="tab.icon"
                      size="18px"
                      class="icon"
                    />
                    <span class="text">{{ tab.label }}</span>
                  </span>
                </q-tab>
              </q-tabs>
            </div>
          </div>
          <div class="my-profile-card__body">
            <MyProfileFieldGrid :fields="activeTabFields" />
          </div>
        </section>
      </div>

      <aside class="col-12 col-lg-4 my-profile-page__sidebar">
        <section class="my-profile-card my-profile-page__quick-actions">
          <div class="my-profile-card__header">
            <h3 class="my-profile-card__title">
              {{ t('myProfileSectionQuickActions') }}
            </h3>
          </div>
          <div class="my-profile-card__body">
                <MyProfileQuickActions
                  :user-id="profile.tenantUserId"
                  @change-password="changePasswordOpen = true"
                />
          </div>
        </section>
      </aside>
    </div>

    <ChangePasswordDialog v-model="changePasswordOpen" />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ChangePasswordDialog from 'components/ChangePasswordDialog.vue'
import MyProfileSummaryCard from
  'components/my-profile/MyProfileSummaryCard.vue'
import MyProfileFieldGrid from
  'components/my-profile/MyProfileFieldGrid.vue'
import MyProfileQuickActions from
  'components/my-profile/MyProfileQuickActions.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useAuthStore } from 'stores/auth-store.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  buildMyProfileViewModel,
  loadMyProfileData,
  myProfileTabKeys,
} from 'src/utils/my-profile.js'
import { myProfileTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()
const { userInfo, activeSubtenant } = storeToRefs(authStore)

const loading = ref(false)
const activeTab = ref(myProfileTabKeys.personal)
const changePasswordOpen = ref(false)
const profile = ref(null)

const tabs = computed(() => [
  {
    key: myProfileTabKeys.personal,
    label: t('myProfileTabPersonal'),
    icon: 'person_outline',
  },
  {
    key: myProfileTabKeys.activity,
    label: t('myProfileTabActivity'),
    icon: 'history',
  },
])

const personalFields = computed(() => {
  if (!profile.value) {
    return []
  }

  return [
    {
      key: 'firstName',
      label: t('firstName'),
      value: profile.value.firstName,
    },
    {
      key: 'lastName',
      label: t('lastName'),
      value: profile.value.lastName,
    },
    {
      key: 'email',
      label: t('email'),
      value: profile.value.email,
    },
    {
      key: 'phone',
      label: t('phone'),
      value: profile.value.phone,
    },
    {
      key: 'position',
      label: t('staffListColPosition'),
      value: profile.value.position,
    },
    {
      key: 'systemRole',
      label: t('myProfileFieldSystemRole'),
      value: profile.value.systemRole,
    },
    {
      key: 'staffNo',
      label: t('staffListColStaffNo'),
      value: profile.value.staffNo,
    },
    {
      key: 'clinician',
      label: t('staffListColClinician'),
      value: profile.value.clinicianLabel,
    },
    {
      key: 'bio',
      label: t('description'),
      value: profile.value.bio,
      fullWidth: true,
    },
  ]
})

const activityFields = computed(() => {
  if (!profile.value) {
    return []
  }

  return [
    {
      key: 'lastLogin',
      label: t('userListColLastLogin'),
      value: profile.value.lastLogin,
    },
    {
      key: 'memberSince',
      label: t('userListColCreatedAt'),
      value: profile.value.memberSince,
    },
    {
      key: 'hireDate',
      label: t('staffListColHireDate'),
      value: profile.value.hireDate,
    },
    {
      key: 'status',
      label: t('status'),
      value: profile.value.status,
    },
  ]
})

const activeTabFields = computed(() =>
  activeTab.value === myProfileTabKeys.activity
    ? activityFields.value
    : personalFields.value,
)

async function loadProfile() {
  const userId = userInfo.value?.id
  if (userId == null) {
    profile.value = buildMyProfileViewModel({
      authUserInfo: userInfo.value,
      activeSubtenant: activeSubtenant.value,
      t,
    })

    return
  }

  loading.value = true
  try {
    const { userRecord, staffForm } = await loadMyProfileData({
      userId,
      staffId: userInfo.value?.staffMember?.id ?? null,
      t,
    })
    profile.value = buildMyProfileViewModel({
      userRecord,
      staffForm,
      authUserInfo: userInfo.value,
      activeSubtenant: activeSubtenant.value,
      t,
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('myProfileLoadError'),
      })
    }
    profile.value = buildMyProfileViewModel({
      authUserInfo: userInfo.value,
      activeSubtenant: activeSubtenant.value,
      t,
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadProfile()
})
</script>
