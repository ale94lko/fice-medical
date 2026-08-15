<template>
  <div
    v-if="rows.length"
    class="admin-data-table__scroll assigned-clinicians-table__scroll">
    <AdminQTable
      class="table admin-data-table admin-data-table--embedded
        admin-data-table--inline-column-settings assigned-clinicians-table"
      flat
      hide-bottom
      row-key="value"
      :rows="rows"
      :columns="columns"
      :pagination="tablePagination"
      :grid="showGrid"
      :card-layout="mobileCardLayout">
      <template #body-cell-primary="scope">
        <q-td :props="scope">
          <div
            v-if="scope.row.isPrimary"
            class="assigned-clinicians-table__primary
              assigned-clinicians-table__primary--active">
            <q-icon name="star" size="20px" />
            <span>{{ t('staffTaxonomyPrimaryBadge') }}</span>
          </div>
          <button
            v-else-if="canEdit"
            type="button"
            class="assigned-clinicians-table__primary
              assigned-clinicians-table__primary--action"
            :data-testid="tid.assignedClinicianRowSetPrimary(scope.row.value)"
            @click="emit('set-primary', scope.row)">
            <q-icon name="star_border" size="20px" />
            <span>{{ t('staffTaxonomySetPrimary') }}</span>
          </button>
          <span v-else class="text-grey-7">—</span>
        </q-td>
      </template>

      <template #body-cell-clinician="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          <div class="assigned-clinicians-table__clinician">
            <ClinicianSelectAvatar
              :photo-file-id="scope.row.photoFileId"
            />
            <div class="assigned-clinicians-table__name">
              {{ clinicianName(scope.row) }}
            </div>
          </div>
        </q-td>
      </template>

      <template #body-cell-specialty="scope">
        <q-td :props="scope">
          <span
            v-if="clinicianSpecialty(scope.row)"
            class="assigned-clinicians-table__specialty"
            :class="`assigned-clinicians-table__specialty--${
              specialtyTone(scope.row)
            }`">
            {{ clinicianSpecialty(scope.row) }}
          </span>
          <span v-else class="text-grey-7">—</span>
        </q-td>
      </template>

      <template #row-actions="{ row }">
        <div class="admin-table-row-actions">
          <q-btn
            v-if="canEdit"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="delete"
            :data-testid="tid.assignedClinicianRowRemove(row.value)"
            :size="siteBreakpoints.SM"
            :aria-label="t('delete')"
            @click="emit('delete', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('delete') }}
            </q-tooltip>
          </q-btn>
          <span
            v-else
            class="text-grey-6">
            —
          </span>
        </div>
      </template>
    </AdminQTable>
  </div>

  <div
    v-else
    class="admin-data-table__empty full-width row flex-center
      text-grey-7 q-gutter-sm q-pa-lg">
    <q-icon name="inbox" size="md" />
    <span>{{ emptyLabel }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminQTable from 'components/AdminQTable.vue'
import ClinicianSelectAvatar from 'components/ClinicianSelectAvatar.vue'
import { siteBreakpoints } from 'components/constants.js'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import { taxonomySpecialtyTone } from
  'src/utils/staff-taxonomy-display.js'

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
  canEdit: {
    type: Boolean,
    default: true,
  },
  emptyLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['delete', 'set-primary'])

const { t } = useI18n()
const { showGrid } = useAdminTableMobileGrid()
const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.entries ?? [])

/** Compact mobile cards (same pattern as FMH / Insurance). */
const mobileCardLayout = {
  title: 'clinician',
  subtitle: null,
  status: 'primary',
  badges: ['specialty'],
  hideEmpty: true,
}

const columns = computed(() => [
  {
    name: 'primary',
    label: t('assignedCliniciansColPrimary'),
    align: 'left',
    field: row => row.isPrimary,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'clinician',
    label: t('assignedCliniciansColClinician'),
    align: 'left',
    field: row => clinicianName(row),
    sortable: false,
    headerStyle: 'min-width: 200px',
    style: 'min-width: 200px',
  },
  {
    name: 'specialty',
    label: t('assignedCliniciansColSpecialty'),
    align: 'left',
    field: row => clinicianSpecialty(row),
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: row => row.value,
    sortable: false,
    required: true,
    headerStyle: 'min-width: 96px',
    style: 'min-width: 96px',
  },
])

function clinicianName(row) {
  return String(row?.name ?? row?.label ?? '').trim() || '—'
}

function clinicianSpecialty(row) {
  return String(row?.specialty ?? '').trim()
}

function specialtyTone(row) {
  return taxonomySpecialtyTone(clinicianSpecialty(row))
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.assigned-clinicians-table {
  &__scroll {
    max-width: 100%;
  }

  &.table:not(.q-table--grid) {
    min-width: 560px;
  }

  &__primary {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 88px;
    padding: 0;
    border: 0;
    background: transparent;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
  }

  &__primary--active {
    color: #c9a227;
  }

  &__primary--action {
    color: $primary;
    cursor: pointer;
  }

  &__primary--action:hover {
    text-decoration: underline;
  }

  &__clinician {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__name {
    font-weight: 600;
    color: $text-strong;
    line-height: 1.3;
  }

  &__specialty {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
  }

  &__specialty--green {
    color: #1b7a4a;
    background: rgba(27, 122, 74, 0.12);
  }

  &__specialty--purple {
    color: #6b4bb3;
    background: rgba(107, 75, 179, 0.12);
  }

  &__specialty--teal {
    color: $primary;
    background: rgba($primary, 0.12);
  }

  &__specialty--blue {
    color: #2f6fed;
    background: rgba(47, 111, 237, 0.12);
  }

  &__specialty--neutral {
    color: $text-muted;
    background: rgba($grey-5, 0.35);
  }
}
</style>
