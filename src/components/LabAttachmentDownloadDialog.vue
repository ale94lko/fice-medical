<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog('lab-attachment-download')"
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog insurance-dialog--confirm
        app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onClose">
        {{ t('labDownloadSelectTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('labDownloadSelectMessage') }}
        </p>
        <ul class="lab-attachment-download__list">
          <li
            v-for="file in files"
            :key="file.id"
            class="lab-attachment-download__item row items-center no-wrap">
            <q-icon
              name="attach_file"
              size="18px"
              class="lab-attachment-download__file-icon"
            />
            <span class="lab-attachment-download__name col text-body2">
              {{ fileName(file) }}
              <q-tooltip
                class="app-info-tooltip"
                anchor="top middle"
                self="bottom middle"
                :offset="[0, 6]">
                {{ fileName(file) }}
              </q-tooltip>
            </span>
            <q-btn
              flat
              round
              dense
              icon="download"
              color="primary"
              class="app-btn-icon-action"
              :disable="downloadingId === String(file.id)"
              :loading="downloadingId === String(file.id)"
              :aria-label="t('labActionDownload')"
              :data-testid="tid.field(`download-file-${file.id}`)"
              @click="onDownload(file)"
            >
              <q-tooltip
                class="app-info-tooltip"
                anchor="top middle"
                self="bottom middle"
                :offset="[0, 6]">
                {{ t('labActionDownload') }}
              </q-tooltip>
            </q-btn>
          </li>
        </ul>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="modalTestIds.cancel('lab-attachment-download')"
          :label="t('close')"
          @click="onClose"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import { labTestIds as tid, modalTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  files: {
    type: Array,
    default: () => [],
  },
  downloadingId: {
    type: [String, Number],
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'download'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

watch(
  () => props.modelValue,
  visible => {
    if (visible && !(props.files ?? []).length) {
      open.value = false
    }
  },
)

function fileName(file) {
  return String(
    file?.name
    ?? file?.originalFilename
    ?? file?.original_filename
    ?? '',
  ).trim() || '—'
}

function onDownload(file) {
  if (file?.id == null) {
    return
  }
  emit('download', file)
}

function onClose() {
  open.value = false
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.lab-attachment-download__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.lab-attachment-download__item {
  gap: 4px;
  min-width: 0;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.lab-attachment-download__file-icon {
  flex-shrink: 0;
  color: $text-muted;
}

.lab-attachment-download__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
