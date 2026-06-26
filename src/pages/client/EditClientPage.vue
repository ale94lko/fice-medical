<template>
  <q-page class="admin-page add-client-page fit">
    <AppLoadingOverlay
      scope="content"
      :showing="pageBusy"
      :message="pageBusyMessage"
    />
    <AddClientPageHeader
      :title="t('editClient')"
      :subtitle="t('editClientSubtitle')"
      :breadcrumb-current="t('editClient')"
      :active-tab-label="activeTabLabel || t('tabBasicInformation')"
      :photo-file-id="profilePhotoFileId"
      :client-id="clientId"
      :photo-disabled="profilePhotoDisabled"
      @update:photo-file-id="onProfilePhotoUpdate"
    >
      <template #actions>
        <q-btn
          v-if="canSaveForm"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="clientPageTestIds.save"
          :loading="false"
          :disable="saving || initialLoading"
          :label="t('save')"
          @click="onSave"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="clientPageTestIds.close"
          :disable="saving || initialLoading"
          :label="t('close')"
          @click="onClose"
        />
      </template>
    </AddClientPageHeader>

    <q-card flat bordered class="add-client-page__card">
      <q-card-section class="add-client-page__card-body q-pa-md">
        <AddClientForm
          :key="clientId"
          ref="clientFormRef"
          mode="edit"
          :client-id="clientId"
          :initial-active-tab="initialActiveTab"
          :initial-active-sub-tab="initialActiveSubTab"
          @cancel="goToClientList"
          @tab-label="activeTabLabel = $event"
          @profile-photo-change="profilePhotoFileId = $event"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AddClientForm from '../../components/client/AddClientForm.vue'
import AddClientPageHeader from
  '../../components/client/AddClientPageHeader.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { clientPageTestIds } from 'src/test-ids/index.js'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const clientFormRef = ref(null)
const activeTabLabel = ref('')
const profilePhotoFileId = ref(null)

const clientId = computed(() => route.params.id)
const initialActiveTab = computed(() =>
  String(route.query.tab ?? '').trim(),
)
const initialActiveSubTab = computed(() =>
  String(route.query.subTab ?? '').trim(),
)

const saving = computed(() => clientFormRef.value?.saving ?? false)
const initialLoading = computed(
  () => clientFormRef.value?.initialLoading ?? false,
)
const pageBusy = computed(() => {
  if (!clientFormRef.value) {
    return true
  }

  return clientFormRef.value.formBusy ?? false
})
const pageBusyMessage = computed(() => {
  if (!clientFormRef.value) {
    return t('appLoading')
  }

  return clientFormRef.value.formBusyMessage ?? t('appLoading')
})
const canSaveForm = computed(
  () => clientFormRef.value?.canSaveForm ?? true,
)
const profilePhotoDisabled = computed(() => {
  const formRef = clientFormRef.value
  if (!formRef) {
    return false
  }

  return Boolean(
    formRef.saving
    || formRef.initialLoading
    || formRef.profilePhotoReadonly,
  )
})

function onProfilePhotoUpdate(fileId) {
  clientFormRef.value?.setProfilePhotoFileId(fileId)
}

function onSave() {
  clientFormRef.value?.onSave()
}

function onClose() {
  clientFormRef.value?.requestClose()
}

function goToClientList() {
  router.push('/clients')
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

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
