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
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title shrink>
          FiCE Medical
        </q-toolbar-title>
        <q-space />
        <SubtenantToolbar class="q-mr-xs" />
        <q-btn flat round dense icon="notifications">
        </q-btn>
        <q-btn flat round dense icon="manage_accounts">
          <q-menu class="user-menu">
            <q-list style="min-width: 100px">
              <q-item clickable @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>{{ t('signOut') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>
    <q-footer class="app-footer">
      <q-toolbar class="justify-center">
        <label class="">&copy; 2025 FiCE Medical. Powered by LandA Apps</label>
      </q-toolbar>
    </q-footer>
    <q-drawer
      class="app-drawer"
      v-model="sidebar"
      show-if-above
      bordered
      :mini="drawerMini"
      :breakpoint="drawerOverlayBreakpoint">
      <q-scroll-area
        class="fit"
        :horizontal-thumb-style="{ opacity: 0 }">
        <q-list padding>
          <q-item
            clickable
            v-ripple
            to="/dashboard"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>{{ t('dashboard') }}</q-item-section>
            <q-tooltip
              v-if="drawerMini"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              {{ t('dashboard') }}
            </q-tooltip>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu && showClientMenu"
            v-model="clientMenu"
            expand-separator
            icon="diversity_1"
            :label="t('client')"
            :content-inset-level="1"
            :header-class="isClientActive ? activeClass : ''">
            <q-item
              clickable
              v-ripple
              to="/clients"
              :active-class="activeClass"
            >
              <q-item-section>{{ t('clientList') }}</q-item-section>
            </q-item>
            <q-item clickable v-ripple :active-class="activeClass">
              <q-item-section>{{ t('priorAuthorization') }}</q-item-section>
            </q-item>
            <q-item clickable v-ripple :active-class="activeClass">
              <q-item-section>{{ t('clientAssignment') }}</q-item-section>
            </q-item>
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
                v-if="clientMenu"
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
              class="app-drawer-submenu"
              v-model="clientMenu">
                <q-item
                  clickable
                  v-ripple
                  to="/clients"
                  :active-class="activeClass"
                >
                <q-item-section>{{ t('clientList') }}</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
              <q-item-section>{{ t('priorAuthorization') }}</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
              <q-item-section>{{ t('clientAssignment') }}</q-item-section>
              </q-item>
            </q-menu>
            <q-tooltip
              v-if="drawerMini && !clientMenu"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              {{ t('client') }}
            </q-tooltip>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu"
            v-model="providerMenu"
            :content-inset-level="1"
            expand-separator
            icon="monitor_heart"
            label="Providers">
            <q-item clickable v-ripple>
              <q-item-section>TCM</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>CMHC</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>Psychiatrist</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>PCP</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>Radiologist</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>Laboratory</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>RBT</q-item-section>
            </q-item>
          </q-expansion-item>
          <q-item clickable v-ripple v-else>
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
              class="app-drawer-submenu"
              v-model="providerMenu">
              <q-item clickable v-ripple>
                <q-item-section>TCM</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>CMHC</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Psychiatrist</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>PCP</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Radiologist</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Laboratory</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>RBT</q-item-section>
              </q-item>
            </q-menu>
            <q-tooltip
              v-if="drawerMini && !providerMenu"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              Providers
            </q-tooltip>
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="medical_services" />
            </q-item-section>
            <q-item-section>Services</q-item-section>
            <q-tooltip
              v-if="drawerMini"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              Services
            </q-tooltip>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu"
            v-model="humanResourcesMenu"
            :content-inset-level="1"
            expand-separator
            icon="groups"
            label="Human Resources">
            <q-item clickable v-ripple>
              <q-item-section>General</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>Employees</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>Human Resources</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>Credentials and Roles</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>Signatures</q-item-section>
            </q-item>
          </q-expansion-item>
          <q-item clickable v-ripple v-else>
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
              class="app-drawer-submenu"
              v-model="humanResourcesMenu">
              <q-item clickable v-ripple>
                <q-item-section>General</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Employees</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Human Resources</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Credentials and Roles</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Signatures</q-item-section>
              </q-item>
            </q-menu>
            <q-tooltip
              v-if="drawerMini && !humanResourcesMenu"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              Human Resources
            </q-tooltip>
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="account_balance" />
            </q-item-section>
            <q-item-section>Billing</q-item-section>
            <q-tooltip
              v-if="drawerMini"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              Billing
            </q-tooltip>
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="equalizer" />
            </q-item-section>
            <q-item-section>Reports</q-item-section>
            <q-tooltip
              v-if="drawerMini"
              anchor="center right"
              self="center left"
              :offset="[8, 0]"
              class="app-drawer-tooltip">
              Reports
            </q-tooltip>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu && showAdministrationMenu"
            v-model="administrationMenu"
            :content-inset-level="1"
            expand-separator
            icon="manage_accounts"
            :label="t('administration')">
            <q-item clickable v-ripple>
              <q-item-section>General</q-item-section>
            </q-item>
          </q-expansion-item>
          <q-item
            v-else-if="showAdministrationMenu"
            clickable
            v-ripple>
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
              class="app-drawer-submenu"
              v-model="administrationMenu">
              <q-item clickable v-ripple>
                <q-item-section>General</q-item-section>
              </q-item>
            </q-menu>
            <q-tooltip
              v-if="drawerMini && !administrationMenu"
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
    </q-drawer>
    <q-page-container>
      <router-view />
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
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth-store.js'
import {
  drawerMobileMaxPx,
  siteBreakpointsPx,
} from 'components/constants.js'
import { useI18n } from 'vue-i18n'
import ModalComponent from 'components/ModalComponent.vue'
import SubtenantToolbar from 'components/SubtenantToolbar.vue'

// Composables
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const sidebar = ref(false)
const sidebarExpanded = ref(false)
const showSignOutConfirm = ref(false)
const drawerOverlayBreakpoint = drawerMobileMaxPx + 1

const clientMenu = ref(null)
const providerMenu = ref(null)
const humanResourcesMenu = ref(null)
const administrationMenu = ref(null)

// Computed
const windowWidth = computed(() => $q.screen.width)

const mobileView = computed(
  () => windowWidth.value <= drawerMobileMaxPx,
)
const tabletView = computed(
  () => windowWidth.value > drawerMobileMaxPx
    && windowWidth.value < siteBreakpointsPx.MD,
)
const drawerMini = computed(
  () => sidebar.value && !sidebarExpanded.value && !mobileView.value,
)
const showDrawerExpandControl = computed(
  () => sidebar.value && !mobileView.value,
)
const accordionMenu = computed(
  () => !drawerMini.value,
)
const showClientMenu = computed(() => authStore.showClientMenu)
const showAdministrationMenu = computed(
  () => authStore.showAdministrationMenu,
)
const activeClass = computed(() => 'app-nav-item--active')

const isClientActive = computed(() => {
  const productRoutes = ['/clients', '/clients/add']
  return productRoutes.includes(route.path)
})

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
  sidebar.value = true
  sidebarExpanded.value = true
}

function hideAllMenu() {
  clientMenu.value = false
  providerMenu.value = false
  humanResourcesMenu.value = false
  administrationMenu.value = false
}

function collapseDrawerToMini() {
  sidebarExpanded.value = false
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

const handleLogout = () => {
  showSignOutConfirm.value = true
}

onMounted(() => {
  syncDrawerWithViewport()
})

watch(() => route.path, () => {
  collapseDrawerForTablet()
  hideAllMenu()
})

watch(windowWidth, () => {
  syncDrawerWithViewport()
  hideAllMenu()
})
</script>
