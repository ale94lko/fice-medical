<template>
  <q-page class="admin-page add-client-page fit">
    <AddClientPageHeader
      :title="t('addNewClient')"
      :subtitle="t('addNewClientSubtitle')"
      :breadcrumb-current="t('addClient')"
      :active-tab-label="activeTabLabel || t('tabBasicInformation')"
      :photo-file-id="profilePhotoFileId"
      :client-id="clientId"
      :photo-disabled="profilePhotoDisabled"
      @update:photo-file-id="onProfilePhotoUpdate"
    >
      <template #banner>
        <div
          id="banner-anchor"
          class="add-client-page__duplicate-banner-anchor"
        />
      </template>
      <template #actions>
        <q-btn
          v-if="canSaveForm"
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
      </template>
    </AddClientPageHeader>

    <q-card flat bordered class="add-client-page__card">
      <q-card-section class="add-client-page__card-body q-pa-md">
        <AddClientForm
          ref="addClientFormRef"
          @saved="onSaved"
          @cancel="goToClientList"
          @tab-label="activeTabLabel = $event"
          @profile-photo-change="profilePhotoFileId = $event"
          @navigate-existing="onNavigateExistingClient"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AddClientForm from '../../components/client/AddClientForm.vue'
import AddClientPageHeader from
  '../../components/client/AddClientPageHeader.vue'
import { clientPageTestIds } from 'src/test-ids/index.js'

const router = useRouter()
const { t } = useI18n()
const addClientFormRef = ref(null)
const activeTabLabel = ref('')
const profilePhotoFileId = ref(null)
const clientId = computed(() => null)

provide('addClientDuplicateBannerInHeader', true)

const saving = computed(() => addClientFormRef.value?.saving ?? false)
const canSaveForm = computed(
  () => addClientFormRef.value?.canSaveForm ?? true,
)
const profilePhotoDisabled = computed(() =>
  saving.value
  || Boolean(addClientFormRef.value?.profilePhotoReadonly),
)

function onProfilePhotoUpdate(fileId) {
  addClientFormRef.value?.setProfilePhotoFileId(fileId)
}

function onSave() {
  addClientFormRef.value?.onSave()
}

function onClose() {
  addClientFormRef.value?.requestClose()
}

function goToClientList() {
  router.push('/clients')
}

function onNavigateExistingClient({ clientId } = {}) {
  const id = String(clientId ?? '').trim()
  if (!id) {
    return
  }
  router.push({ name: 'EditClient', params: { id } })
}

function onSaved({ clientId, activeTab } = {}) {
  const id = String(clientId ?? '').trim()
  if (!id) {
    return
  }

  const tab = String(activeTab ?? '').trim()
  if (tab) {
    router.replace({ name: 'EditClient', params: { id }, query: { tab } })
    return
  }

  router.replace({ name: 'EditClient', params: { id } })
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.add-client-page__duplicate-banner-anchor {
  flex: 1 1 220px;
  min-width: 0;
  max-width: 100%;
}

.add-client-page__card {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: $surface;
  border-radius: $radius-lg;
  border-color: $border-subtle !important;
  box-shadow: $shadow-sm;
}
</style>
