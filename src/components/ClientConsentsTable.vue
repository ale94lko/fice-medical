<template>
  <div
    class="admin-data-table__scroll client-consents-table"
    :data-testid="tid.table">
    <AdminQTable
      class="table admin-data-table admin-data-table--embedded
        admin-data-table--inline-column-settings"
      flat
      hide-bottom
      row-key="id"
      :rows="rows"
      :columns="columns"
      :pagination="tablePagination"
      :loading="loading">
      <template #body-cell-name="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          <div class="client-consents-table__name-row row items-center
            no-wrap q-gutter-xs">
            <span class="client-consents-table__name">
              {{ scope.row.consentName || '—' }}
            </span>
            <span
              v-if="scope.row.required"
              class="client-consents-table__required">
              {{ t('consentTemplateRequired') }}
            </span>
          </div>
        </q-td>
      </template>

      <template #body-cell-consentType="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ typeLabel(scope.row.consentType) }}
        </q-td>
      </template>

      <template #body-cell-status="scope">
        <q-td :props="scope">
          <AdminTableStatusCell
            :label="statusLabel(scope.row.status)"
            :variant="consentStatusVariant(scope.row.status)"
          />
        </q-td>
      </template>

      <template #body-cell-version="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.version ? `v${scope.row.version}` : '—' }}
        </q-td>
      </template>

      <template #body-cell-signedAt="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ signedAtLabel(scope.row) }}
        </q-td>
      </template>

      <template #row-actions="{ row }">
        <div class="admin-table-row-actions">
          <q-btn
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="visibility"
            :size="siteBreakpoints.SM"
            :data-testid="tid.btnView(row.id)"
            :aria-label="t('view')"
            @click="emit('view', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('view') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canSignRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="draw"
            :size="siteBreakpoints.SM"
            :data-testid="tid.btnSign(row.id)"
            :aria-label="t('clientConsentRequestSignature')"
            @click="emit('sign', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('clientConsentRequestSignature') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canDeclineRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="thumb_down"
            :size="siteBreakpoints.SM"
            :data-testid="tid.btnDecline(row.id)"
            :aria-label="t('clientConsentDecline')"
            @click="emit('decline', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('clientConsentDecline') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canCancelRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="cancel"
            :size="siteBreakpoints.SM"
            :data-testid="tid.btnCancel(row.id)"
            :aria-label="t('clientConsentCancel')"
            @click="emit('cancel', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('clientConsentCancel') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canDownloadRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="download"
            :size="siteBreakpoints.SM"
            :data-testid="tid.btnDownload(row.id)"
            :aria-label="t('clientConsentDownload')"
            @click="emit('download', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('clientConsentDownload') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canRevokeRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="undo"
            :size="siteBreakpoints.SM"
            :data-testid="tid.btnRevoke(row.id)"
            :aria-label="t('clientConsentRevoke')"
            @click="emit('revoke', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('clientConsentRevoke') }}
            </q-tooltip>
          </q-btn>
        </div>
      </template>

      <template #no-data>
        <div
          class="full-width row flex-center text-grey-7
            q-gutter-sm q-pa-lg">
          <q-icon name="inbox" size="md" />
          <span>{{ emptyLabel }}</span>
        </div>
      </template>
    </AdminQTable>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import {
  consentStatusValues,
  siteBreakpoints,
} from 'components/constants.js'
import { clientConsentsTestIds as tid } from 'src/test-ids/index.js'
import {
  consentStatusI18nKey,
  consentStatusVariant,
  consentTypeI18nKey,
  formatConsentDateTime,
} from 'src/utils/consent-i18n.js'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  canSign: {
    type: Boolean,
    default: false,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  canDownload: {
    type: Boolean,
    default: false,
  },
  canRevoke: {
    type: Boolean,
    default: false,
  },
  emptyLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'view',
  'sign',
  'decline',
  'cancel',
  'download',
  'revoke',
])

const { t, te } = useI18n()

const tablePagination = computed(() => ({
  page: 1,
  rowsPerPage: 0,
  rowsNumber: props.rows.length,
}))

const columns = computed(() => [
  {
    name: 'name',
    label: t('clientConsentColName'),
    align: 'left',
    field: 'consentName',
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: 'consentType',
    label: t('clientConsentColType'),
    align: 'left',
    field: 'consentType',
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'status',
    label: t('clientConsentColStatus'),
    align: 'left',
    field: 'status',
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'version',
    label: t('clientConsentColVersion'),
    align: 'left',
    field: 'version',
    sortable: false,
    headerStyle: 'min-width: 80px',
    style: 'min-width: 80px',
  },
  {
    name: 'signedAt',
    label: t('clientConsentColSignedAt'),
    align: 'left',
    field: 'signedAt',
    sortable: false,
    headerStyle: 'min-width: 150px',
    style: 'min-width: 150px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'right',
    field: 'id',
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
])

function statusLabel(status) {
  const key = consentStatusI18nKey(status)

  return te(key) ? t(key) : (status || '—')
}

function typeLabel(type) {
  const token = String(type ?? '').trim()
  if (!token) {
    return '—'
  }
  const key = consentTypeI18nKey(token)

  return te(key) ? t(key) : token
}

function signedAtLabel(row) {
  if (row?.status === consentStatusValues.accepted && row.signedAt) {
    return formatConsentDateTime(row.signedAt)
  }
  if (row?.status === consentStatusValues.revoked && row.revokedAt) {
    return formatConsentDateTime(row.revokedAt)
  }

  return '—'
}

function canSignRow(row) {
  return props.canSign
    && row.status === consentStatusValues.pendingSignature
}

function canDeclineRow(row) {
  return props.canEdit
    && row.status === consentStatusValues.pendingSignature
}

function canCancelRow(row) {
  return props.canEdit
    && row.status === consentStatusValues.pendingSignature
}

function canDownloadRow(row) {
  return props.canDownload
    && row.status === consentStatusValues.accepted
}

function canRevokeRow(row) {
  return props.canRevoke
    && row.status === consentStatusValues.accepted
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.client-consents-table__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-consents-table__required {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba($primary, 0.12);
  color: $primary;
  font-size: 0.7rem;
  font-weight: 600;
}
</style>
