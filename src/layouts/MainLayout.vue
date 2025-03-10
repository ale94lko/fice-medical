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
              <q-item clickable v-close-popup>
                <q-item-section @click="$q.dark.toggle()">Dark mode</q-item-section>
              </q-item>
              <q-separator />
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
      :breakpoint="500">
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
          <q-item clickable v-ripple>
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
              <q-item clickable>
                <q-item-section>Intake</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section>Prior authorization</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section>Patient assignment</q-item-section>
              </q-item>
            </q-menu>
          </q-item>
          <q-item clickable v-ripple>
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
              <q-item clickable>
                <q-item-section>TCM</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section>CMHC</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section>Psychiatrist</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section>PCP</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section>Radiologist</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section>Laboratory</q-item-section>
              </q-item>
              <q-item clickable>
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
          <q-item clickable v-ripple>
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
              <q-item clickable>
                <q-item-section>General</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section>Employees</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section>Human Resources</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section>Credentials and Roles</q-item-section>
              </q-item>
              <q-item clickable>
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
          <q-item clickable v-ripple>
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
              <q-item clickable>
                <q-item-section>General</q-item-section>
              </q-item>
            </q-menu>
          </q-item>
        </q-list>
      </q-scroll-area>
      <div class="q-mini-drawer-hide absolute" style="bottom: 15px; right: 10px">
        <q-btn
          dense
          class="bg-white"
          icon="chevron_left"
          @click="drawerClick"/>
      </div>
      <div class="q-mini-drawer-only absolute" style="bottom: 15px; right: 10px">
        <q-btn
          dense
          class="bg-white"
          icon="chevron_right"
          @click="drawerClick"/>
      </div>
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from 'vue'
import { useAuthStore } from 'stores/auth-store.js'

export default {
  methods: {
    handleLogout() {
      const store = useAuthStore()
      store.logout(this.$router)
    }
  },
  setup() {
    const sidebar = ref(false)
    const sidebarExpanded = ref(true)
    const patientMenu = ref(null)
    const providerMenu = ref(null)
    const humanResourcesMenu = ref(null)
    const administrationMenu = ref(null)

    function toggleLeftDrawer() {
      sidebar.value = !sidebar.value
    }

    function drawerClick() {
      sidebarExpanded.value = !sidebarExpanded.value
    }

    return {
      sidebar,
      sidebarExpanded,
      patientMenu,
      providerMenu,
      humanResourcesMenu,
      administrationMenu,
      toggleLeftDrawer,
      drawerClick
    }
  }
}
</script>
