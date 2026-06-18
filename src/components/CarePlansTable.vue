<template>
  <div v-if="rows.length" class="fmh-table-wrap">
    <table class="fmh-table">
      <thead>
        <tr>
          <th>{{ t('carePlanColName') }}</th>
          <th>{{ t('carePlanColProblem') }}</th>
          <th>{{ t('status') }}</th>
          <th>{{ t('carePlanColProgress') }}</th>
          <th>{{ t('carePlanColTargetDate') }}</th>
          <th class="fmh-table-actions-col">{{ t('actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.name || '—' }}</td>
          <td>{{ row.problem || '—' }}</td>
          <td>
            <span
              class="care-plan-status-badge"
              :class="`care-plan-status-badge--${row.status}`">
              {{ statusLabel(row.status) }}
            </span>
          </td>
          <td>
            <CarePlanProgressCell :progress="row.progress" :goals-count="0" />
          </td>
          <td>
            <span v-if="row.targetDate" class="row items-center no-wrap">
              <q-icon name="event" size="16px" class="q-mr-xs text-grey-6" />
              {{ row.targetDate }}
            </span>
            <span v-else>—</span>
          </td>
          <td class="fmh-table-actions">
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="visibility"
              :data-testid="tid.rowView(row.id)"
              :aria-label="t('carePlanActionView')"
              @click="emit('view', row)"
            />
            <q-btn
              v-if="canEditRow(row)"
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="edit"
              :data-testid="tid.rowEdit(row.id)"
              :aria-label="t('edit')"
              @click="emit('edit', row)"
            />
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="more_vert"
              :data-testid="tid.rowMore(row.id)"
              :aria-label="t('carePlanActionMore')"
            >
              <q-menu anchor="bottom right" self="top right">
                <q-list dense style="min-width: 180px">
                  <q-item
                    v-if="canSignRow(row)"
                    v-close-popup
                    clickable
                    @click="emit('sign', row)">
                    <q-item-section avatar>
                      <q-icon name="draw" size="18px" />
                    </q-item-section>
                    <q-item-section>
                      {{ t('carePlanActionSign') }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-if="canChangeStatus(row)"
                    v-close-popup
                    clickable
                    @click="emit('status', row, 'COMPLETED')">
                    <q-item-section avatar>
                      <q-icon name="check_circle" size="18px" />
                    </q-item-section>
                    <q-item-section>
                      {{ t('carePlanActionMarkCompleted') }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-if="canChangeStatus(row)"
                    v-close-popup
                    clickable
                    @click="emit('status', row, 'ARCHIVED')">
                    <q-item-section avatar>
                      <q-icon name="archive" size="18px" />
                    </q-item-section>
                    <q-item-section>
                      {{ t('carePlanActionArchive') }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div
    v-else
    class="care-plans-empty text-center q-pa-xl">
    <q-icon name="track_changes" size="48px" color="grey-5" />
    <p class="text-body2 text-grey-7 q-mt-md q-mb-none">
      {{ emptyLabel }}
    </p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import CarePlanProgressCell from 'components/CarePlanProgressCell.vue'
import { carePlanStatuses } from 'components/constants.js'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'

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
  canSign: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['view', 'edit', 'sign', 'status'])

const { t } = useI18n()

function statusLabel(status) {
  const key = carePlanI18nKey('carePlanStatus', status)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return status || '—'
}

function canEditRow(row) {
  return props.canEdit
    && !row.signed
    && row.status !== carePlanStatuses.completed
    && row.status !== carePlanStatuses.archived
}

function canSignRow(row) {
  return props.canSign
    && !row.signed
    && row.status === carePlanStatuses.active
}

function canChangeStatus(row) {
  return props.canEdit && row.status === carePlanStatuses.active
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.care-plan-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.care-plan-status-badge--ACTIVE {
  background: #dcfce7;
  color: #166534;
}

.care-plan-status-badge--COMPLETED {
  background: #e0e7ff;
  color: #3730a3;
}

.care-plan-status-badge--ARCHIVED {
  background: #f1f5f9;
  color: $text-muted;
}
</style>
