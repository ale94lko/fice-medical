<template>
  <div
    class="admin-data-table client-overview-screenings-dialog-list"
    :data-testid="clientOverviewTestIds.screeningsDialogList">
    <div
      v-for="(item, index) in items"
      :key="`screening-dialog-${index}`"
      class="admin-table-grid-item">
      <q-card
        flat
        bordered
        class="admin-table-grid-card admin-table-grid-card--compact">
        <div class="admin-table-grid-card__header">
          <DataItemComponent
            class="admin-table-grid-card__data-item"
            icon="assignment"
            icon-style="neutral"
            icon-size="44px"
            title-size="medium"
            :title="item.templateName || '—'"
            :clickable="false">
            <template #actions>
              <AdminTableStatusCell
                :label="statusLabel(item.status)"
                :variant="statusVariant(item.status)"
              />
            </template>
          </DataItemComponent>
        </div>

        <div class="admin-table-grid-card__body">
          <div class="admin-table-grid-card__field-row">
            <div class="admin-table-grid-card__field-label">
              {{ t('screeningDate') }}
            </div>
            <div class="admin-table-grid-card__field-value">
              {{ item.screeningDate || '—' }}
            </div>
          </div>

          <div
            v-for="field in extraFields(item)"
            :key="field.key"
            class="admin-table-grid-card__field-row">
            <div class="admin-table-grid-card__field-label">
              {{ t(field.labelKey) }}
            </div>
            <div class="admin-table-grid-card__field-value">
              {{ item[field.key] }}
            </div>
          </div>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import DataItemComponent from 'components/template/DataItemComponent.vue'
import { screeningStatuses } from 'components/constants.js'
import { clientOverviewTestIds } from 'src/test-ids/index.js'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()

const EXTRA_FIELDS = [
  {
    key: 'completedAt',
    labelKey: 'clientOverviewModuleDialogCompletedAt',
  },
  { key: 'weight', labelKey: 'screeningWeight' },
  { key: 'height', labelKey: 'screeningHeight' },
  { key: 'bmi', labelKey: 'screeningBmi' },
]

function hasValue(value) {
  const text = String(value ?? '').trim()

  return Boolean(text) && text !== '—'
}

function extraFields(item) {
  return EXTRA_FIELDS.filter(field => hasValue(item?.[field.key]))
}

function statusLabel(status) {
  if (status === screeningStatuses.completed) {
    return t('screeningStatusCompleted')
  }
  if (status === screeningStatuses.cancelled) {
    return t('screeningStatusCancelled')
  }
  if (status === screeningStatuses.draft) {
    return t('screeningStatusInProgress')
  }

  return t('screeningStatusDraft')
}

function statusVariant(status) {
  if (status === screeningStatuses.completed) {
    return 'active'
  }
  if (status === screeningStatuses.cancelled) {
    return 'other'
  }

  return 'inactive'
}
</script>
