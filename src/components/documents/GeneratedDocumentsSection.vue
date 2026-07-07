<template>
  <article
    v-if="canViewFiles && entityId"
    class="generated-documents-section"
    :data-testid="documentGenerationTestIds.generatedList">
    <header class="generated-documents-section__header row items-center
      no-wrap">
      <q-icon name="description" size="18px" />
      <h3 class="col q-mb-none">
        {{ t('generatedDocumentsTitle') }}
      </h3>
      <q-btn
        flat
        dense
        round
        icon="refresh"
        :loading="loading"
        :aria-label="t('generatedDocumentsRefresh')"
        @click="loadFiles"
      />
    </header>

    <AppLoadingOverlay scope="content" :showing="loading" />

    <ul
      v-if="files.length"
      class="generated-documents-section__list q-pl-none q-mb-none">
      <li
        v-for="file in files"
        :key="file.id"
        class="generated-documents-section__item row items-center
          no-wrap">
        <div class="col min-width-0">
          <p class="generated-documents-section__name q-mb-none">
            {{ file.originalFilename || file.name || '—' }}
          </p>
          <p class="generated-documents-section__meta q-mb-none">
            {{ formatUploadedAt(file.uploadedAt || file.createdAt) }}
          </p>
        </div>
        <q-btn
          flat
          round
          dense
          icon="download"
          class="app-btn-icon-action"
          :loading="downloadingId === file.id"
          :aria-label="t('generatedDocumentsDownload')"
          :data-testid="documentGenerationTestIds.download(file.id)"
          @click="onDownload(file)"
        />
      </li>
    </ul>
    <p
      v-else-if="!loading"
      class="generated-documents-section__empty q-mb-none">
      {{ t('generatedDocumentsEmpty') }}
    </p>
  </article>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { quasarNotifyTypes, storedFileCategories } from
  'components/constants.js'
import { useDocumentGenerationPermissions } from
  'src/composables/useDocumentGenerationPermissions.js'
import {
  downloadStoredFile,
  listStoredFiles,
  triggerBlobDownload,
} from 'src/utils/stored-file-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { documentGenerationTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  entityType: {
    type: String,
    required: true,
  },
  entityId: {
    type: [String, Number],
    default: null,
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
  refreshToken: {
    type: [String, Number],
    default: 0,
  },
})

const { t } = useI18n()
const $q = useQuasar()
const { canViewFiles } = useDocumentGenerationPermissions()

const loading = ref(false)
const downloadingId = ref(null)
const files = ref([])

const entityId = computed(() => {
  const id = Number(props.entityId)

  return Number.isFinite(id) && id > 0 ? id : null
})

function formatUploadedAt(value) {
  const token = String(value ?? '').trim()
  if (!token) {
    return '—'
  }

  const date = new Date(token)
  if (Number.isNaN(date.getTime())) {
    return token
  }

  return date.toLocaleString()
}

async function loadFiles() {
  if (!canViewFiles.value || entityId.value == null) {
    files.value = []

    return
  }

  loading.value = true
  try {
    const result = await listStoredFiles({
      category: storedFileCategories.generatedDocument,
      entityType: props.entityType,
      entityId: entityId.value,
      clientId: props.clientId,
      page: 0,
      limit: 20,
    })
    files.value = result.items ?? []
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('generatedDocumentsLoadError'),
      })
    }
    files.value = []
  } finally {
    loading.value = false
  }
}

async function onDownload(file) {
  if (!file?.id) {
    return
  }

  downloadingId.value = file.id
  try {
    const { blob, fileName } = await downloadStoredFile(file.id)
    triggerBlobDownload(
      blob,
      fileName || file.originalFilename || file.name,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('generatedDocumentsDownloadError'),
      })
    }
  } finally {
    downloadingId.value = null
  }
}

watch(
  () => [props.entityType, props.entityId, props.clientId, props.refreshToken],
  () => {
    void loadFiles()
  },
)

onMounted(() => {
  void loadFiles()
})

defineExpose({ reload: loadFiles })
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.generated-documents-section {
  background: $surface;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: 16px;
  position: relative;

  &__header {
    gap: 8px;
    margin-bottom: 12px;
    color: $text-strong;
    font-size: 0.9375rem;
    font-weight: 700;
  }

  &__list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid $border-subtle;
    border-radius: 10px;
    background: $surface-muted;
  }

  &__name {
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-strong;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    font-size: 0.75rem;
    color: $text-muted;
  }

  &__empty {
    font-size: 0.875rem;
    color: $text-muted;
  }
}
</style>
