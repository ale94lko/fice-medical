<template>
  <q-layout view="hHh Lpr lff">
    <q-header elevated class="bg-teal-10 glossy">
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
          <q-menu fit>
            <q-list style="min-width: 100px">
              <q-item clickable @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>
    <q-footer reveal elevated>
      <q-toolbar class="glossy justify-center">
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
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>
              Dashboard
            </q-item-section>
          </q-item>
          <q-expansion-item
            v-if="accordionMenu"
            v-model="patientMenu"
            :content-inset-level="1"
            expand-separator
            icon="assist_walker"
            label="Patient">
            <q-item clickable v-ripple>
              <q-item-section>Intake</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>Prior authorization</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section>Patient assignment</q-item-section>
            </q-item>
          </q-expansion-item>
          <q-item clickable v-ripple v-else>
            <q-item-section avatar>
              <q-icon name="assist_walker" />
            </q-item-section>
            <q-item-section>Patient</q-item-section>
            <q-item-section side class="text-white">
              <q-icon v-if="patientMenu" name="chevron_left" />
              <q-icon v-else name="chevron_right" />
            </q-item-section>
            <q-menu
              fit
              anchor="top end"
              self="top left"
              class="bg-teal-9 text-white"
              v-model="patientMenu">
              <q-item clickable v-ripple>
                <q-item-section>Intake</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Prior authorization</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Patient assignment</q-item-section>
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
        v-if="sidebarExpanded && !extraSmallView"
        class="absolute"
        style="bottom: 15px; right: 10px">
        <q-btn
          dense
          class="bg-white"
          icon="chevron_left"
          @click="drawerClick(true)"/>
      </div>
      <div v-else-if="!extraSmallView" class="absolute" style="bottom: 15px; right: 10px">
        <q-btn
          dense
          class="bg-white"
          icon="chevron_right"
          @click="drawerClick(false)"/>
      </div>
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { useAuthStore } from 'stores/auth-store.js'
import { siteBreakpoints, siteBreakpointsPx } from 'components/constants.js'

export default {
  data() {
    return {
      sidebar: false,
      sidebarExpanded: true,
      openByMouseOver: false,
      patientMenu: null,
      providerMenu: null,
      humanResourcesMenu: null,
      administrationMenu: null,
    }
  },
  watch: {
    windowWidth() {
      this.hideAllMenu()
    },
  },
  computed: {
    mobileView() {
      return this.$q.screen.name === siteBreakpoints.XS
    },
    extraSmallView() {
      return this.windowWidth <= siteBreakpointsPx.XXS
    },
    windowWidth() {
      return this.$q.screen.width
    },
    accordionMenu() {
      return (this.extraSmallView || this.mobileView) && this.sidebarExpanded
    },
  },
  methods: {
    handleLogout() {
      const store = useAuthStore()
      store.logout(this.$router)
    },
    toggleLeftDrawer() {
      this.sidebar = !this.sidebar
    },
    drawerClick(state) {
      this.sidebarExpanded = !state
      this.openByMouseOver = false
    },
    openDrawer() {
      if (!this.sidebarExpanded && !this.openByMouseOver) {
        this.sidebarExpanded = true
        this.openByMouseOver = true
      }
    },
    closeDrawer() {
      if (this.sidebarExpanded && this.openByMouseOver) {
        this.sidebarExpanded = false
      }
    },
    hideAllMenu() {
      this.patientMenu = false
      this.providerMenu = false
      this.humanResourcesMenu = false
      this.administrationMenu = false
    },
  },
}
</script>
