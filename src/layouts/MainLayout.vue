<template>
  <q-layout view="hHh Lpr lFf" class="app-layout">
    <q-header bordered class="app-header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          :data-testid="layoutTestIds.menuToggle"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title shrink>
          FiCE Medical
        </q-toolbar-title>
        <q-space />
        <SubtenantToolbar class="q-mr-xs" />
        <q-btn
          flat
          round
          dense
          icon="notifications"
          :data-testid="layoutTestIds.notifications"
        />
        <AppHeaderUserMenu
          class="q-ml-xs"
          @change-password="handleChangePassword"
          @logout="handleLogout"
        />
      </q-toolbar>
    </q-header>
    <q-footer class="app-footer">
      <q-toolbar class="app-footer__toolbar">
        <p class="app-footer__copyright q-mb-none">
          &copy; 2026 FiCE Medical. Powered by LandA Apps
        </p>
        <q-space />
        <div class="app-footer__pagination">
          <AppFooterPaginationHost />
        </div>
      </q-toolbar>
    </q-footer>
    <q-drawer
      class="app-drawer"
      v-model="sidebar"
      show-if-above
      bordered
      :width="drawerWidthPx"
      :mini-width="drawerMiniWidthPx"
      :mini="drawerMiniProp"
      :mini-to-overlay="drawerMiniToOverlay"
      :breakpoint="drawerOverlayBreakpoint">
      <div
        class="app-drawer__interactive fit column"
        @mouseenter="onDrawerMouseEnter"
        @mouseleave="onDrawerMouseLeave">
      <q-scroll-area
        class="col"
        :horizontal-thumb-style="{ opacity: 0 }">
        <q-list padding>
          <q-item
            v-if="showDashboard"
            clickable
            v-ripple
            to="/dashboard"
            :data-testid="layoutTestIds.navDashboard"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>{{ t('dashboard') }}</q-item-section>
            <q-tooltip
              v-if="drawerShowsMiniTooltips"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              {{ t('dashboard') }}
            </q-tooltip>
          </q-item>
          <q-item
            v-if="showCalendarMenu"
            clickable
            v-ripple
            to="/calendar"
            :data-testid="layoutTestIds.navCalendar"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="calendar_month" />
            </q-item-section>
            <q-item-section>{{ t('calendar') }}</q-item-section>
            <q-tooltip
              v-if="drawerShowsMiniTooltips"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              {{ t('calendar') }}
            </q-tooltip>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu && showClientMenu"
            v-model="clientMenuExpanded"
            expand-separator
            icon="diversity_1"
            :label="t('client')"
            :data-testid="layoutTestIds.navClientMenu"
            :header-class="isClientActive ? activeClass : ''">
            <AppDrawerSubNavItem
              v-if="showClientList"
              icon="format_list_bulleted"
              to="/clients"
              :active-class="activeClass"
              :test-id="layoutTestIds.navClientList">
              {{ t('clientList') }}
            </AppDrawerSubNavItem>
            <AppDrawerSubNavItem
              v-if="showClientAdd"
              icon="person_add"
              to="/clients/add"
              :active-class="activeClass"
              :test-id="layoutTestIds.navClientAdd">
              {{ t('addClient') }}
            </AppDrawerSubNavItem>
          </q-expansion-item>
          <q-item
            v-else-if="showClientMenu"
            v-ripple
            clickable
            :active="isClientActive"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="diversity_1" />
            </q-item-section>
            <q-item-section>{{ t('client') }}</q-item-section>
            <q-item-section side>
              <q-icon
                v-if="clientMenuPopup"
                name="chevron_left"
                :class="isActiveClass(isClientActive)"
              />
              <q-icon
                v-else
                name="chevron_right"
                :class="isActiveClass(isClientActive)"
              />
            </q-item-section>
            <q-menu
              fit
              anchor="top end"
              self="top left"
              class="app-drawer-submenu app-light-menu"
              v-model="clientMenuPopup">
              <AppDrawerSubNavItem
                v-if="showClientList"
                icon="format_list_bulleted"
                to="/clients"
                :active-class="activeClass"
                :test-id="layoutTestIds.navClientList">
                {{ t('clientList') }}
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem
                v-if="showClientAdd"
                icon="person_add"
                to="/clients/add"
                :active-class="activeClass"
                :test-id="layoutTestIds.navClientAdd">
                {{ t('addClient') }}
              </AppDrawerSubNavItem>
            </q-menu>
            <q-tooltip
              v-if="drawerShowsMiniTooltips && !clientMenuPopup"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              {{ t('client') }}
            </q-tooltip>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu && showStaffMenu"
            v-model="staffMenuExpanded"
            expand-separator
            icon="badge"
            :label="t('navStaffClinician')"
            :data-testid="layoutTestIds.navStaffClinicianMenu"
            :header-class="isStaffActive ? activeClass : ''">
            <AppDrawerSubNavItem
              v-if="showAdminStaffList"
              icon="format_list_bulleted"
              :to="'/staff'"
              :active-class="activeClass"
              :test-id="layoutTestIds.navStaffList">
              {{ t('navStaffClinicianList') }}
            </AppDrawerSubNavItem>
            <AppDrawerSubNavItem
              v-if="showStaffAddClinician"
              icon="medical_services"
              :to="{ name: 'AddClinician' }"
              :active-class="activeClass"
              :test-id="layoutTestIds.navStaffAddClinician">
              {{ t('staffListAddClinician') }}
            </AppDrawerSubNavItem>
            <AppDrawerSubNavItem
              v-if="showStaffAddStaff"
              icon="person_add"
              :to="{ name: 'AddStaff' }"
              :active-class="activeClass"
              :test-id="layoutTestIds.navStaffAddStaff">
              {{ t('staffListAddStaff') }}
            </AppDrawerSubNavItem>
          </q-expansion-item>
          <q-item
            v-else-if="showStaffMenu"
            v-ripple
            clickable
            :active="isStaffActive"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="badge" />
            </q-item-section>
            <q-item-section>{{ t('navStaffClinician') }}</q-item-section>
            <q-item-section side>
              <q-icon
                v-if="staffMenuPopup"
                name="chevron_left"
                :class="isActiveClass(isStaffActive)"
              />
              <q-icon
                v-else
                name="chevron_right"
                :class="isActiveClass(isStaffActive)"
              />
            </q-item-section>
            <q-menu
              fit
              anchor="top end"
              self="top left"
              class="app-drawer-submenu app-light-menu"
              v-model="staffMenuPopup">
              <AppDrawerSubNavItem
                v-if="showAdminStaffList"
                icon="format_list_bulleted"
                :to="'/staff'"
                :active-class="activeClass"
                :test-id="layoutTestIds.navStaffList">
                {{ t('navStaffClinicianList') }}
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem
                v-if="showStaffAddClinician"
                icon="medical_services"
                :to="{ name: 'AddClinician' }"
                :active-class="activeClass"
                :test-id="layoutTestIds.navStaffAddClinician">
                {{ t('staffListAddClinician') }}
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem
                v-if="showStaffAddStaff"
                icon="person_add"
                :to="{ name: 'AddStaff' }"
                :active-class="activeClass"
                :test-id="layoutTestIds.navStaffAddStaff">
                {{ t('staffListAddStaff') }}
              </AppDrawerSubNavItem>
            </q-menu>
            <q-tooltip
              v-if="drawerShowsMiniTooltips && !staffMenuPopup"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              {{ t('navStaffClinician') }}
            </q-tooltip>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu && showUsersMenu"
            v-model="usersMenuExpanded"
            expand-separator
            icon="group"
            :label="t('users')"
            :data-testid="layoutTestIds.navUsersMenu"
            :header-class="isUsersActive ? activeClass : ''">
            <AppDrawerSubNavItem
              v-if="showAdminUsers"
              icon="format_list_bulleted"
              to="/administration/users"
              :active-class="activeClass"
              :test-id="layoutTestIds.navUsersList">
              {{ t('navUsersList') }}
            </AppDrawerSubNavItem>
            <AppDrawerSubNavItem
              v-if="showUsersAdd"
              icon="person_add"
              :to="{ name: 'AdminUsersAdd' }"
              :active-class="activeClass"
              :test-id="layoutTestIds.navUsersAdd">
              {{ t('addUser') }}
            </AppDrawerSubNavItem>
          </q-expansion-item>
          <q-item
            v-else-if="showUsersMenu"
            v-ripple
            clickable
            :active="isUsersActive"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="group" />
            </q-item-section>
            <q-item-section>{{ t('users') }}</q-item-section>
            <q-item-section side>
              <q-icon
                v-if="usersMenuPopup"
                name="chevron_left"
                :class="isActiveClass(isUsersActive)"
              />
              <q-icon
                v-else
                name="chevron_right"
                :class="isActiveClass(isUsersActive)"
              />
            </q-item-section>
            <q-menu
              fit
              anchor="top end"
              self="top left"
              class="app-drawer-submenu app-light-menu"
              v-model="usersMenuPopup">
              <AppDrawerSubNavItem
                v-if="showAdminUsers"
                icon="format_list_bulleted"
                to="/administration/users"
                :active-class="activeClass"
                :test-id="layoutTestIds.navUsersList">
                {{ t('navUsersList') }}
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem
                v-if="showUsersAdd"
                icon="person_add"
                :to="{ name: 'AdminUsersAdd' }"
                :active-class="activeClass"
                :test-id="layoutTestIds.navUsersAdd">
                {{ t('addUser') }}
              </AppDrawerSubNavItem>
            </q-menu>
            <q-tooltip
              v-if="drawerShowsMiniTooltips && !usersMenuPopup"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              {{ t('users') }}
            </q-tooltip>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu && showProvidersMenu"
            v-model="providerMenu"
            expand-separator
            icon="monitor_heart"
            label="Providers">
            <AppDrawerSubNavItem icon="healing">TCM</AppDrawerSubNavItem>
            <AppDrawerSubNavItem icon="health_and_safety">
              CMHC
            </AppDrawerSubNavItem>
            <AppDrawerSubNavItem icon="psychology">
              Psychiatrist
            </AppDrawerSubNavItem>
            <AppDrawerSubNavItem icon="local_hospital">PCP</AppDrawerSubNavItem>
            <AppDrawerSubNavItem icon="medical_information">
              Radiologist
            </AppDrawerSubNavItem>
            <AppDrawerSubNavItem icon="biotech">Laboratory</AppDrawerSubNavItem>
            <AppDrawerSubNavItem icon="support_agent">RBT</AppDrawerSubNavItem>
          </q-expansion-item>
          <q-item
            v-else-if="showProvidersMenu"
            clickable
            v-ripple>
            <q-item-section avatar>
              <q-icon name="monitor_heart" />
            </q-item-section>
            <q-item-section>Providers</q-item-section>
            <q-item-section side>
              <q-icon v-if="providerMenu" name="chevron_left" />
              <q-icon v-else name="chevron_right" />
            </q-item-section>
            <q-menu
              fit
              anchor="top end"
              self="top left"
              class="app-drawer-submenu app-light-menu"
              v-model="providerMenu">
              <AppDrawerSubNavItem icon="healing">TCM</AppDrawerSubNavItem>
              <AppDrawerSubNavItem icon="health_and_safety">
                CMHC
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem icon="psychology">
                Psychiatrist
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem icon="local_hospital">
                PCP
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem icon="medical_information">
                Radiologist
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem icon="biotech">
                Laboratory
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem icon="support_agent">
                RBT
              </AppDrawerSubNavItem>
            </q-menu>
            <q-tooltip
              v-if="drawerShowsMiniTooltips && !providerMenu"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              Providers
            </q-tooltip>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu && showHumanResourcesMenu"
            v-model="humanResourcesMenu"
            expand-separator
            icon="groups"
            label="Human Resources">
            <AppDrawerSubNavItem
              v-if="showHrGeneral"
              icon="tune">
              General
            </AppDrawerSubNavItem>
            <AppDrawerSubNavItem
              v-if="showHrCredentials"
              icon="admin_panel_settings">
              Credentials and Roles
            </AppDrawerSubNavItem>
            <AppDrawerSubNavItem
              v-if="showHrCredentials"
              icon="draw">
              Signatures
            </AppDrawerSubNavItem>
          </q-expansion-item>
          <q-item
            v-else-if="showHumanResourcesMenu"
            clickable
            v-ripple>
            <q-item-section avatar>
              <q-icon name="groups" />
            </q-item-section>
            <q-item-section>Human Resources</q-item-section>
            <q-item-section side>
              <q-icon v-if="humanResourcesMenu" name="chevron_left" />
              <q-icon v-else name="chevron_right" />
            </q-item-section>
            <q-menu
              fit
              anchor="top end"
              self="top left"
              class="app-drawer-submenu app-light-menu"
              v-model="humanResourcesMenu">
              <AppDrawerSubNavItem
                v-if="showHrGeneral"
                icon="tune">
                General
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem
                v-if="showHrCredentials"
                icon="admin_panel_settings">
                Credentials and Roles
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem
                v-if="showHrCredentials"
                icon="draw">
                Signatures
              </AppDrawerSubNavItem>
            </q-menu>
            <q-tooltip
              v-if="drawerShowsMiniTooltips && !humanResourcesMenu"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              Human Resources
            </q-tooltip>
          </q-item>
          <q-item
            v-if="showBilling"
            clickable
            v-ripple>
            <q-item-section avatar>
              <q-icon name="account_balance" />
            </q-item-section>
            <q-item-section>Billing</q-item-section>
            <q-tooltip
              v-if="drawerShowsMiniTooltips"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              Billing
            </q-tooltip>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu && showAdministrationMenu"
            v-model="administrationMenu"
            expand-separator
            icon="manage_accounts"
            :label="t('administration')"
            :header-class="isAdministrationActive ? activeClass : ''">
            <AppDrawerSubNavItem
              v-if="showAdminSubtenants"
              icon="apartment"
              to="/administration/subtenants"
              :active-class="activeClass"
              :test-id="layoutTestIds.navAdminSubtenants">
              {{ t('subtenantListTitle') }}
            </AppDrawerSubNavItem>
            <AppDrawerSubNavItem
              v-if="showServicesProcedures"
              icon="medical_services"
              to="/administration/services"
              :active-class="activeClass"
              :test-id="layoutTestIds.navAdminServices">
              {{ t('serviceProcedureListTitle') }}
            </AppDrawerSubNavItem>
            <AppDrawerSubNavItem
              v-if="showAdminGeneral"
              icon="tune">
              {{ t('administrationGeneral') }}
            </AppDrawerSubNavItem>
          </q-expansion-item>
          <q-item
            v-else-if="showAdministrationMenu"
            clickable
            v-ripple
            :active="isAdministrationActive"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="manage_accounts" />
            </q-item-section>
            <q-item-section>{{ t('administration') }}</q-item-section>
            <q-item-section side>
              <q-icon v-if="administrationMenu" name="chevron_left" />
              <q-icon v-else name="chevron_right" />
            </q-item-section>
            <q-menu
              fit
              anchor="top end"
              self="top left"
              class="app-drawer-submenu app-light-menu"
              v-model="administrationMenu">
              <AppDrawerSubNavItem
                v-if="showAdminSubtenants"
                icon="apartment"
                to="/administration/subtenants"
                :active-class="activeClass"
                :test-id="layoutTestIds.navAdminSubtenants">
                {{ t('subtenantListTitle') }}
              </AppDrawerSubNavItem>
              <AppDrawerSubNavItem
                v-if="showAdminGeneral"
                icon="tune">
                {{ t('administrationGeneral') }}
              </AppDrawerSubNavItem>
            </q-menu>
            <q-tooltip
              v-if="drawerShowsMiniTooltips && !administrationMenu"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              {{ t('administration') }}
            </q-tooltip>
          </q-item>
        </q-list>
      </q-scroll-area>
      <div
        v-if="showDrawerExpandControl && sidebarExpanded"
        class="absolute icon-hide">
        <q-btn
          dense
          flat
          icon="chevron_left"
          :title="t('collapseMenu')"
          :aria-label="t('collapseMenu')"
          @click="collapseDrawerToMini" />
      </div>
      <div
        v-else-if="showDrawerExpandControl"
        class="absolute icon-hide">
        <q-btn
          dense
          flat
          icon="chevron_right"
          :title="t('expandMenu')"
          :aria-label="t('expandMenu')"
          @click="expandDrawer" />
      </div>
      </div>
    </q-drawer>
    <q-page-container id="app-content-root" class="app-content-root">
      <router-view :key="activeContentKey" />
    </q-page-container>
  </q-layout>
  <ModalComponent
    v-model="showSignOutConfirm"
    :confirm-text="t('confirm')"
    :cancel-text="t('cancel')"
    :title="t('confirmSignOutTitle')"
    :message="t('confirmSignOut')"
    @confirm="handleSignOutConfirm"
    @cancel="handleSignOutCancel"
  />
  <SessionExpiryDialog
    v-if="!authStore.mustChangePassword"
    v-model="warningVisible"
    :countdown="formattedCountdown"
    :keep-open-loading="keepOpenLoading"
    :closing-section="closingSection"
    @close-section="closeSection"
    @keep-open="keepSectionOpen"
  />
  <ChangePasswordDialog v-model="showChangePasswordDialog" />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth-store.js'
import {
  drawerMobileMaxPx,
  drawerMiniWidthPx,
  drawerWidthPx,
  siteBreakpointsPx,
} from 'components/constants.js'
import { useI18n } from 'vue-i18n'
import ModalComponent from 'components/ModalComponent.vue'
import ChangePasswordDialog from 'components/ChangePasswordDialog.vue'
import SessionExpiryDialog from 'components/SessionExpiryDialog.vue'
import AppDrawerSubNavItem from 'components/AppDrawerSubNavItem.vue'
import AppFooterPaginationHost from
  'components/admin-table/AppFooterPaginationHost.vue'
import SubtenantToolbar from 'components/SubtenantToolbar.vue'
import AppHeaderUserMenu from 'components/AppHeaderUserMenu.vue'
import { useMainNavPermissions } from 'src/composables/useMainNavPermissions.js'
import { useSessionInactivity } from 'src/composables/useSessionInactivity.js'
import { layoutTestIds } from 'src/test-ids/index.js'

// Composables
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeContentKey = computed(() =>
  `${route.fullPath}::${authStore.activeSubtenantId ?? 0}`,
)
const {
  warningVisible,
  formattedCountdown,
  keepOpenLoading,
  closingSection,
  closeSection,
  keepSectionOpen,
} = useSessionInactivity()

function readInitialSidebarOpen() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.innerWidth > drawerMobileMaxPx
}

// State
const sidebar = ref(readInitialSidebarOpen())
const sidebarExpanded = ref(false)
const drawerHoverExpanded = ref(false)
const showSignOutConfirm = ref(false)
const showChangePasswordDialog = ref(false)
const drawerOverlayBreakpoint = drawerMobileMaxPx + 1

const clientMenuExpanded = ref(false)
const clientMenuPopup = ref(false)
const staffMenuExpanded = ref(false)
const staffMenuPopup = ref(false)
const usersMenuExpanded = ref(false)
const usersMenuPopup = ref(false)
const providerMenu = ref(false)
const humanResourcesMenu = ref(false)
const administrationMenu = ref(false)

// Computed
const windowWidth = computed(() => {
  const quasarWidth = $q.screen.width
  if (typeof window === 'undefined') {
    return quasarWidth
  }

  return Math.max(quasarWidth, window.innerWidth)
})

const mobileView = computed(
  () => windowWidth.value <= drawerMobileMaxPx,
)
const tabletView = computed(
  () => windowWidth.value > drawerMobileMaxPx
    && windowWidth.value < siteBreakpointsPx.MD,
)
const drawerUsesMiniLayout = computed(
  () => !mobileView.value && !sidebarExpanded.value,
)
const drawerMiniProp = computed(
  () => drawerUsesMiniLayout.value && !drawerHoverExpanded.value,
)
const drawerMiniToOverlay = computed(
  () => drawerUsesMiniLayout.value,
)
const drawerShowsMiniTooltips = computed(
  () => drawerUsesMiniLayout.value && !drawerHoverExpanded.value,
)
const showDrawerExpandControl = computed(
  () => !mobileView.value,
)
const accordionMenu = computed(
  () => sidebarExpanded.value
    || drawerHoverExpanded.value
    || mobileView.value,
)
const {
  showDashboard,
  showCalendarMenu,
  showClientMenu,
  showClientList,
  showClientAdd,
  showStaffMenu,
  showStaffAddClinician,
  showStaffAddStaff,
  showUsersMenu,
  showUsersAdd,
  showProvidersMenu,
  showHumanResourcesMenu,
  showHrGeneral,
  showHrCredentials,
  showAdminStaffList,
  showBilling,
  showAdministrationMenu,
  showAdminGeneral,
  showAdminSubtenants,
  showAdminUsers,
  showServicesProcedures,
} = useMainNavPermissions()
const activeClass = computed(() => 'app-nav-item--active')

const isClientActive = computed(() => {
  return route.path.startsWith('/clients')
})

const isStaffActive = computed(() => route.path.startsWith('/staff'))

const isUsersActive = computed(() =>
  route.path.startsWith('/administration/users'),
)

const isAdministrationActive = computed(() =>
  route.path.startsWith('/administration')
    && !route.path.startsWith('/administration/users'),
)

const isActiveClass = (condition) => {
  return condition ? 'app-nav-item--active' : ''
}

// Methods
const { t } = useI18n()

const handleSignOutConfirm = () => {
  authStore.logout(router, t)
}

const handleSignOutCancel = () => {
  showSignOutConfirm.value = false
}

const toggleLeftDrawer = () => {
  if (mobileView.value) {
    sidebar.value = !sidebar.value

    return
  }
  sidebar.value = !sidebar.value
  if (sidebar.value && tabletView.value) {
    sidebarExpanded.value = false
  }
}

function expandDrawer() {
  if (mobileView.value) {
    return
  }
  drawerHoverExpanded.value = false
  sidebar.value = true
  sidebarExpanded.value = true
  syncNavMenusFromRoute()
}

function onDrawerMouseEnter() {
  if (!drawerUsesMiniLayout.value) {
    return
  }
  drawerHoverExpanded.value = true
}

function onDrawerMouseLeave() {
  drawerHoverExpanded.value = false
  clientMenuPopup.value = false
  staffMenuPopup.value = false
  usersMenuPopup.value = false
  if (!sidebarExpanded.value) {
    closeMiniPopups()
  }
}

function syncNavMenusFromRoute() {
  if (accordionMenu.value && isClientActive.value) {
    clientMenuExpanded.value = true
  } else if (!isClientActive.value) {
    clientMenuExpanded.value = false
  }
  if (accordionMenu.value && isStaffActive.value) {
    staffMenuExpanded.value = true
  } else if (!isStaffActive.value) {
    staffMenuExpanded.value = false
  }
  if (accordionMenu.value && isUsersActive.value) {
    usersMenuExpanded.value = true
  } else if (!isUsersActive.value) {
    usersMenuExpanded.value = false
  }
  if (accordionMenu.value && isAdministrationActive.value) {
    administrationMenu.value = true
  } else if (!isAdministrationActive.value) {
    administrationMenu.value = false
  }
  clientMenuPopup.value = false
  staffMenuPopup.value = false
  usersMenuPopup.value = false
  if (!isClientActive.value) {
    providerMenu.value = false
    humanResourcesMenu.value = false
  }
}

function closeMiniPopups() {
  clientMenuPopup.value = false
  staffMenuPopup.value = false
  usersMenuPopup.value = false
  providerMenu.value = false
  humanResourcesMenu.value = false
  administrationMenu.value = false
}

function hideAllMenu() {
  closeMiniPopups()
  if (!isClientActive.value) {
    clientMenuExpanded.value = false
  }
  if (!isStaffActive.value) {
    staffMenuExpanded.value = false
  }
  if (!isUsersActive.value) {
    usersMenuExpanded.value = false
  }
}

function collapseDrawerToMini() {
  sidebarExpanded.value = false
  drawerHoverExpanded.value = false
  hideAllMenu()
}

function collapseDrawerForTablet() {
  if (!tabletView.value) {
    return
  }
  sidebarExpanded.value = false
}

function syncDrawerWithViewport() {
  if (mobileView.value) {
    return
  }
  if (tabletView.value) {
    sidebarExpanded.value = false
  }
}

const handleChangePassword = () => {
  showChangePasswordDialog.value = true
}

const handleLogout = () => {
  showSignOutConfirm.value = true
}

onMounted(() => {
  syncDrawerWithViewport()
  if (!mobileView.value) {
    sidebar.value = true
  }
  syncNavMenusFromRoute()
})

watch(mobileView, (isMobile) => {
  if (!isMobile) {
    sidebar.value = true
  }
  syncDrawerWithViewport()
  syncNavMenusFromRoute()
})

watch(isClientActive, () => {
  syncNavMenusFromRoute()
})

watch(isStaffActive, () => {
  syncNavMenusFromRoute()
})

watch(isUsersActive, () => {
  syncNavMenusFromRoute()
})

watch(() => route.path, () => {
  collapseDrawerForTablet()
  syncNavMenusFromRoute()
})

watch(accordionMenu, open => {
  if (open) {
    syncNavMenusFromRoute()
  } else {
    closeMiniPopups()
  }
})

watch(windowWidth, () => {
  syncDrawerWithViewport()
  syncNavMenusFromRoute()
})
</script>
