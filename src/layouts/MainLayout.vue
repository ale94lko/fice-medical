<template>
  <q-layout view="hHh Lpr lff">
    <q-header elevated class="bg-teal-10">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>
          FiCE Medical
        </q-toolbar-title>
        <q-btn flat round dense icon="notifications">
        </q-btn>
        <q-btn flat round dense icon="manage_accounts">
          <q-menu class="user-menu">
            <q-list style="min-width: 100px">
              <q-item clickable @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>{{ t('sign_out') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>
    <q-footer reveal elevated>
      <q-toolbar class="justify-center">
        <label class="">&copy; 2025 FiCE Medical. Powered by LandA Apps</label>
      </q-toolbar>
    </q-footer>
    <q-drawer
      class="bg-teal-10"
      v-model="sidebar"
      show-if-above
      bordered
      :mini="sidebar && !sidebarExpanded"
      :breakpoint="500"
      @mouseover="openDrawer()"
      @mouseout="closeDrawer()">
      <q-scroll-area
        class="fit text-white"
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
          </q-item>
          <q-expansion-item
            v-if="accordionMenu"
            v-model="clientMenu"
            expand-separator
            icon="diversity_1"
            :label="t('client')"
            :content-inset-level="1"
            :header-class="isClientActive ? activeClass : ''">
            <q-item clickable v-ripple to="/clients" :active-class="activeClass">
              <q-item-section>{{ t('client_list') }}</q-item-section>
            </q-item>
            <q-item clickable v-ripple :active-class="activeClass">
              <q-item-section>{{ t('prior_authorization') }}</q-item-section>
            </q-item>
            <q-item clickable v-ripple :active-class="activeClass">
              <q-item-section>{{ t('client_assignment') }}</q-item-section>
            </q-item>
          </q-expansion-item>
          <q-item
            v-else
            v-ripple
            clickable
            :active="isClientActive"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="diversity_1" />
            </q-item-section>
            <q-item-section>{{ t('client') }}</q-item-section>
            <q-item-section side>
              <q-icon v-if="clientMenu" name="chevron_left" :class="isActiveClass(isClientActive)" />
              <q-icon v-else name="chevron_right" :class="isActiveClass(isClientActive)" />
            </q-item-section>
            <q-menu
              fit
              anchor="top end"
              self="top left"
              class="bg-teal-9 text-white"
              v-model="clientMenu">
              <q-item clickable v-ripple to="/clients" :active-class="activeClass">
                <q-item-section>{{ t('client_list') }}</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>{{ t('prior_authorization') }}</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>{{ t('client_assignment') }}</q-item-section>
              </q-item>
            </q-menu>
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
            <q-item-section side class="text-white">
              <q-icon v-if="providerMenu" name="chevron_left" />
              <q-icon v-else name="chevron_right" />
            </q-item-section>
            <q-menu
              fit
              anchor="top end"
              self="top left"
              class="bg-teal-9 text-white"
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
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="medical_services" />
            </q-item-section>
            <q-item-section>Services</q-item-section>
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
            <q-item-section side class="text-white">
              <q-icon v-if="humanResourcesMenu" name="chevron_left" />
              <q-icon v-else name="chevron_right" />
            </q-item-section>
            <q-menu
              fit
              anchor="top end"
              self="top left"
              class="bg-teal-9 text-white"
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
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="account_balance" />
            </q-item-section>
            <q-item-section>Billing</q-item-section>
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="equalizer" />
            </q-item-section>
            <q-item-section>Reports</q-item-section>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu"
            v-model="administrationMenu"
            :content-inset-level="1"
            expand-separator
            icon="manage_accounts"
            label="Administration">
            <q-item clickable v-ripple>
              <q-item-section>General</q-item-section>
            </q-item>
          </q-expansion-item>
          <q-item clickable v-ripple v-else>
            <q-item-section avatar>
              <q-icon name="manage_accounts" />
            </q-item-section>
            <q-item-section>Administration</q-item-section>
            <q-item-section side class="text-white">
              <q-icon v-if="administrationMenu" name="chevron_left" />
              <q-icon v-else name="chevron_right" />
            </q-item-section>
            <q-menu
              fit
              anchor="top end"
              self="top left"
              class="bg-teal-9 text-white"
              v-model="administrationMenu">
              <q-item clickable v-ripple>
                <q-item-section>General</q-item-section>
              </q-item>
            </q-menu>
          </q-item>
        </q-list>
      </q-scroll-area>
      <div
        v-if="sidebarExpanded && !extraSmallView" class="absolute icon-hide">
        <q-btn
          dense
          class="bg-white"
          icon="chevron_left"
          @click="drawerClick(true)" />
      </div>
      <div v-else-if="!extraSmallView" class="absolute icon-hide">
        <q-btn
          dense
          class="bg-white"
          icon="chevron_right"
          @click="drawerClick(false)" />
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
    :title="t('confirm_sign_out_title')"
    :message="t('confirm_sign_out')"
    @confirm="handleSignOutConfirm"
    @cancel="handleSignOutCancel"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth-store.js'
import { siteBreakpoints, siteBreakpointsPx } from 'components/constants.js'
import { useI18n } from 'vue-i18n'
import ModalComponent from 'components/ModalComponent.vue'

// Composables
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const sidebar = ref(false)
const sidebarExpanded = ref(true)
const openByMouseOver = ref(false)
const showSignOutConfirm = ref(false)

const clientMenu = ref(null)
const providerMenu = ref(null)
const humanResourcesMenu = ref(null)
const administrationMenu = ref(null)

// Computed
const windowWidth = computed(() => $q.screen.width)

const mobileView = computed(() => $q.screen.name === siteBreakpoints.XS)
const extraSmallView = computed(() => windowWidth.value <= siteBreakpointsPx.XXS)
const accordionMenu = computed(() => (extraSmallView.value || mobileView.value) && sidebarExpanded.value)
const activeClass = computed(() => 'text-primary bg-blue-1')

const isClientActive = computed(() => {
  const productRoutes = ['/clients', '/clients/add']
  return productRoutes.includes(route.path)
})

const isActiveClass = (condition) => {
  return condition ? 'text-primary' : 'text-white'
}

// Methods
const { t } = useI18n()

const handleSignOutConfirm = () => {
  authStore.logout(router)
}

const handleSignOutCancel = () => {
  showSignOutConfirm.value = false
}

const toggleLeftDrawer = () => {
  sidebar.value = !sidebar.value
}

const drawerClick = (state) => {
  sidebarExpanded.value = !state
  openByMouseOver.value = false
}

const openDrawer = () => {
  if (!sidebarExpanded.value && !openByMouseOver.value) {
    sidebarExpanded.value = true
    openByMouseOver.value = true
  }
}

const closeDrawer = () => {
  if (sidebarExpanded.value && openByMouseOver.value) {
    sidebarExpanded.value = false
  }
}

const hideAllMenu = () => {
  clientMenu.value = false
  providerMenu.value = false
  humanResourcesMenu.value = false
  administrationMenu.value = false
}

const handleLogout = () => {
  showSignOutConfirm.value = true
}

// Watchers
watch(windowWidth, () => {
  hideAllMenu()
})
</script>
