<template>
  <div v-if="rows.length" class="fmh-table-wrap fmh-table-wrap--wide">
    <table class="fmh-table fmh-table--wide clinical-notes-table">
      <thead>
        <tr>
          <th>{{ t('clinicalNoteColDateTime') }}</th>
          <th>{{ t('clinicalNoteColClinician') }}</th>
          <th>{{ t('status') }}</th>
          <th>{{ t('clinicalNoteColSummary') }}</th>
          <th class="fmh-table-actions-col">{{ t('actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.noteDateTimeDisplay || '—' }}</td>
          <td>
            <span
              class="clinical-notes-table__clinician row items-center
                no-wrap">
              <span class="clinical-notes-table__avatar">
                {{ row.clinicianInitials || '?' }}
              </span>
              <span>{{ row.clinicianLabel || '—' }}</span>
            </span>
          </td>
          <td>
            <span
              class="clinical-note-status-badge"
              :class="`clinical-note-status-badge--${row.status}`">
              {{ statusLabel(row.status) }}
            </span>
          </td>
          <td class="clinical-notes-table__summary">
            {{ row.summaryPreview || '—' }}
          </td>
          <td class="fmh-table-actions clinical-notes-table__actions">
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action clinical-notes-table__action"
              color="primary"
              icon="visibility"
              :data-testid="tid.rowView(row.id)"
              :aria-label="t('clinicalNoteActionView')"
              @click="emit('view', row)"
            />
            <q-btn
              v-if="canDownloadRow(row)"
              flat
              round
              size="sm"
              class="app-btn-icon-action clinical-notes-table__action"
              color="primary"
              icon="download"
              :data-testid="tid.rowDownload(row.id)"
              :aria-label="t('clinicalNoteActionDownload')"
              @click="emit('download', row)"
            />
            <q-btn
              v-if="canEditRow(row)"
              flat
              round
              size="sm"
              class="app-btn-icon-action clinical-notes-table__action"
              color="primary"
              icon="edit"
              :data-testid="tid.rowEdit(row.id)"
              :aria-label="t('edit')"
              @click="emit('edit', row)"
            />
            <q-btn
              v-if="canDeleteRow(row)"
              flat
              round
              size="sm"
              class="app-btn-icon-action clinical-notes-table__action"
              icon="delete"
              :data-testid="tid.rowDelete(row.id)"
              :aria-label="t('delete')"
              @click="emit('delete', row)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div
    v-else
    class="clinical-notes-empty text-center q-pa-xl">
    <q-icon name="description" size="48px" color="grey-5" />
    <p class="text-body2 text-grey-7 q-mt-md q-mb-none">
      {{ emptyLabel }}
    </p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { clinicalNoteStatuses } from 'components/constants.js'
import { clinicalNoteTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  canEdit: {
    type: Boolean,
    default: true,
  },
  canDelete: {
    type: Boolean,
    default: true,
  },
  canDownload: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['view', 'edit', 'delete', 'download'])

const { t } = useI18n()

function statusLabel(status) {
  if (status === clinicalNoteStatuses.signed) {
    return t('clinicalNoteStatusSigned')
  }
  if (status === clinicalNoteStatuses.draft) {
    return t('clinicalNoteStatusDraft')
  }

  return status || '—'
}

function canEditRow(row) {
  return props.canEdit && row.status === clinicalNoteStatuses.draft
}

function canDeleteRow(row) {
  return props.canDelete && row.status === clinicalNoteStatuses.draft
}

function canDownloadRow(row) {
  return props.canDownload && row.status === clinicalNoteStatuses.signed
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.clinical-note-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
}

.clinical-note-status-badge--SIGNED {
  background: #dcfce7;
  color: #166534;
}

.clinical-note-status-badge--DRAFT {
  background: #f1f5f9;
  color: $text-muted;
}

.clinical-notes-table__clinician {
  gap: 8px;
}

.clinical-notes-table__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: $text-muted;
  font-size: 0.6875rem;
  font-weight: 700;
  flex-shrink: 0;
}

.clinical-notes-table__summary {
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clinical-notes-table__actions {
  white-space: nowrap;
}

.clinical-notes-table__action {
  color: $text-muted !important;
}
</style>
