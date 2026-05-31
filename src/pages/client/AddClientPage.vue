<template>
  <q-page class="admin-page add-client-page">
    <header class="add-client-page__header">
      <div class="add-client-page__intro">
        <h1 class="add-client-page__title">{{ t('addNewClient') }}</h1>
        <p class="add-client-page__subtitle">
          {{ t('addNewClientSubtitle') }}
        </p>
        <q-breadcrumbs class="add-client-page__breadcrumbs" gutter="xs">
          <q-breadcrumbs-el :label="t('clients')" to="/clients" />
          <q-breadcrumbs-el :label="t('addClient')" />
          <q-breadcrumbs-el
            :label="activeTabLabel || t('tabBasicInformation')"
          />
        </q-breadcrumbs>
      </div>
      <div class="add-client-page__actions">
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="clientPageTestIds.save"
          :loading="saving"
          :disable="saving"
          :label="t('save')"
          @click="onSave"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="clientPageTestIds.close"
          :disable="saving"
          :label="t('close')"
          @click="onClose"
        />
      </div>
    </header>

    <q-card flat bordered class="add-client-page__card">
      <q-card-section class="add-client-page__card-body q-pa-md">
        <AddClientForm
          ref="addClientFormRef"
          @saved="onSaved"
          @cancel="goToClientList"
          @tab-label="activeTabLabel = $event"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AddClientForm from 'components/AddClientForm.vue'
import { clientPageTestIds } from 'src/test-ids/index.js'

const router = useRouter()
const { t } = useI18n()
const addClientFormRef = ref(null)
const activeTabLabel = ref('')

const saving = computed(() => addClientFormRef.value?.saving ?? false)

function onSave() {
  addClientFormRef.value?.onSave()
}

function onClose() {
  addClientFormRef.value?.requestClose()
}

function goToClientList() {
  router.push('/clients')
}

function onSaved() {
  setTimeout(() => {
    goToClientList()
  }, 800)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.add-client-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.add-client-page__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: $text-strong;
}

.add-client-page__subtitle {
  margin: 2px 0 4px;
  font-size: 0.875rem;
  line-height: 1.35;
  color: $text-muted;
}

.add-client-page__breadcrumbs {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.3;
  color: $text-muted;
}

.add-client-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.add-client-page__card {
  background: $surface;
  border-radius: $radius-lg;
  border-color: $border-subtle !important;
  box-shadow: $shadow-sm;
}
</style>
