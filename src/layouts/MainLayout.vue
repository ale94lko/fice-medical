<template>
  <q-layout view="hHh Lpr lff">
    <q-header elevated>
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

        <!-- TODO: aqui va el menu y las notificaciones -->
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="sidebar"
      show-if-above
      bordered
      :mini="sidebar && !sidebarExpanded"
      :breakpoint="500"
    >
      <q-scroll-area class="fit" :horizontal-thumb-style="{ opacity: 0 }">
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
            :content-inset-level="0.5"
            expand-separator
            icon="person"
            label="Patient"
          >
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="list" />
              </q-item-section>
              <q-item-section>Intake</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="security" />
              </q-item-section>
              <q-item-section>Prior authorization</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="assignment" />
              </q-item-section>
              <q-item-section>Patient assignment</q-item-section>
            </q-item>
          </q-expansion-item>
          <q-expansion-item
            :content-inset-level="0.5"
            expand-separator
            icon="monitor_heart"
            label="Providers">
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>
                TCM
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>CMHC</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>Psychiatrist</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>PCP</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>Radiologist</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>Laboratory</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>RBT</q-item-section>
            </q-item>
          </q-expansion-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="medical_services" />
            </q-item-section>
            <q-item-section>Services</q-item-section>
          </q-item>
          <q-expansion-item
            :content-inset-level="0.5"
            expand-separator
            icon="groups"
            label="Human Resources">
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>General</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>Employees</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>Human Resources</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>Credentials and Roles</q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>Signatures</q-item-section>
            </q-item>
          </q-expansion-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="account_balance" />
            </q-item-section>
            <q-item-section>Billing</q-item-section>
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="analytics" />
            </q-item-section>
            <q-item-section>Reports</q-item-section>
          </q-item>
          <q-expansion-item
            :content-inset-level="0.5"
            expand-separator
            icon="manage_accounts"
            label="Administration">
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
      <div class="q-mini-drawer-hide absolute" style="bottom: 15px; right: 10px">
        <q-btn
          dense
          icon="chevron_left"
          @click="drawerClick"/>
      </div>
      <div class="q-mini-drawer-only absolute" style="bottom: 15px; right: 10px">
        <q-btn
          dense
          icon="chevron_right"
          @click="drawerClick"/>
      </div>
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'

const sidebar = ref(false)
const sidebarExpanded = ref(true)

function toggleLeftDrawer () {
  sidebar.value = !sidebar.value
}

function drawerClick () {
  sidebarExpanded.value = !sidebarExpanded.value
}

</script>
