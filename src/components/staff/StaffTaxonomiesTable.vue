<template>
  <div
    v-if="rows.length"
    class="admin-data-table__scroll staff-taxonomies-table__scroll">
    <AdminQTable
      class="table admin-data-table admin-data-table--embedded
        admin-data-table--inline-column-settings staff-taxonomies-table"
      flat
      hide-bottom
      row-key="code"
      :rows="rows"
      :columns="columns"
      :pagination="tablePagination">
      <template #body-cell-primary="scope">
        <q-td :props="scope">
          <div
            v-if="scope.row.isPrimary"
            class="staff-taxonomies-table__primary
              staff-taxonomies-table__primary--active">
            <q-icon name="star" size="20px" />
            <span>{{ t('staffTaxonomyPrimaryBadge') }}</span>
          </div>
          <button
            v-else-if="canEdit"
            type="button"
            class="staff-taxonomies-table__primary
              staff-taxonomies-table__primary--action"
            @click="emit('set-primary', scope.row)">
            <q-icon name="star_border" size="20px" />
            <span>{{ t('staffTaxonomySetPrimary') }}</span>
          </button>
          <span v-else class="text-grey-7">—</span>
        </q-td>
      </template>

      <template #body-cell-code="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          <span class="staff-taxonomies-table__code">
            {{ scope.row.code || '—' }}
          </span>
        </q-td>
      </template>

      <template #body-cell-description="scope">
        <q-td :props="scope">
          <div class="staff-taxonomies-table__description">
            <div class="staff-taxonomies-table__description-title">
              {{ descriptionTitle(scope.row) }}
            </div>
            <div
              v-if="descriptionSubtitle(scope.row)"
              class="staff-taxonomies-table__description-subtitle">
              {{ descriptionSubtitle(scope.row) }}
            </div>
          </div>
        </q-td>
      </template>

      <template #body-cell-specialty="scope">
        <q-td :props="scope">
          <span
            v-if="specialtyLabel(scope.row)"
            class="staff-taxonomies-table__specialty"
            :class="`staff-taxonomies-table__specialty--${
              specialtyTone(scope.row)
            }`">
            {{ specialtyLabel(scope.row) }}
          </span>
          <span v-else class="text-grey-7">—</span>
        </q-td>
      </template>

      <template #body-cell-type="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ typeLabel(scope.row) || '—' }}
        </q-td>
      </template>

      <template #row-actions="{ row }">
        <div class="admin-table-row-actions">
          <q-btn
            v-if="canDelete"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="delete"
            :size="siteBreakpoints.SM"
            :title="t('delete')"
            :aria-label="t('delete')"
            @click="emit('delete', row)"
          />
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
import { siteBreakpoints } from 'components/constants.js'
import {
  taxonomyProviderTypeLabel,
  taxonomySpecialtyLabel,
  taxonomySpecialtyTone,
} from 'src/utils/staff-taxonomy-display.js'

const props = defineProps({
  taxonomies: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['set-primary', 'delete'])

const { t } = useI18n()
const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.taxonomies ?? [])

const columns = computed(() => [
  {
    name: 'primary',
    label: t('staffTaxonomyColPrimary'),
    align: 'left',
    field: row => row.isPrimary,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'code',
    label: t('staffTaxonomyColCode'),
    align: 'left',
    field: row => row.code,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'description',
    label: t('staffTaxonomyColDescription'),
    align: 'left',
    field: row => row.displayName,
    sortable: false,
    headerStyle: 'min-width: 220px',
    style: 'min-width: 220px',
  },
  {
    name: 'specialty',
    label: t('staffTaxonomyColSpecialty'),
    align: 'left',
    field: row => specialtyLabel(row),
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'type',
    label: t('staffTaxonomyColType'),
    align: 'left',
    field: row => typeLabel(row),
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: row => row.code,
    sortable: false,
    required: true,
    headerStyle: 'min-width: 72px',
    style: 'min-width: 72px',
  },
])

function descriptionTitle(row) {
  return String(row.displayName ?? row.code ?? '').trim() || '—'
}

function descriptionSubtitle(row) {
  return String(row.definition ?? '').trim()
}

function specialtyLabel(row) {
  return taxonomySpecialtyLabel(row)
}

function specialtyTone(row) {
  return taxonomySpecialtyTone(specialtyLabel(row))
}

function typeLabel(row) {
  return taxonomyProviderTypeLabel(row.grouping, t)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.staff-taxonomies-table {
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

  &__code {
    font-weight: 600;
    color: $text-strong;
    letter-spacing: 0.01em;
  }

  &__description-title {
    font-weight: 600;
    color: $text-strong;
  }

  &__description-subtitle {
    margin-top: 2px;
    color: $text-muted;
    font-size: 0.8125rem;
    line-height: 1.35;
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
    background: rgba($text-muted, 0.12);
  }
}
</style>
