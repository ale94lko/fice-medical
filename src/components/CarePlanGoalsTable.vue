<template>
  <div class="care-plan-goals-table">
    <div class="row items-center justify-between q-mb-sm">
      <SubsectionHeading icon="flag" :title="t('carePlanSectionGoals')" />
      <q-btn
        v-if="!readonly"
        no-caps
        outline
        color="primary"
        class="app-btn-outline"
        icon="add"
        :label="t('carePlanAddGoal')"
        :data-testid="tid.btn('add-goal')"
        @click="emit('add')"
      />
    </div>

    <div
      v-if="goals.length"
      class="add-client-form__fmh-list-card">
      <div class="add-client-form__fmh-table-wrap">
        <table class="add-client-form__fmh-table">
          <thead>
            <tr>
              <th>{{ t('carePlanGoalColTitle') }}</th>
              <th>{{ t('carePlanGoalColTargetDate') }}</th>
              <th>{{ t('status') }}</th>
              <th>{{ t('carePlanColProgress') }}</th>
              <th class="add-client-form__fmh-table-actions-col">
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="goal in goals" :key="goal.id">
              <td>{{ goal.title || '—' }}</td>
              <td>{{ goal.targetDate || '—' }}</td>
              <td>
                <span
                  class="care-plan-goal-status-badge"
                  :class="`care-plan-goal-status-badge--${goal.status}`">
                  {{ goalStatusLabel(goal.status) }}
                </span>
              </td>
              <td>
                <CarePlanProgressCell :progress="goal.progress" />
              </td>
              <td class="add-client-form__fmh-table-actions">
                <q-btn
                  flat
                  round
                  size="sm"
                  class="app-btn-icon-action"
                  color="primary"
                  icon="visibility"
                  :aria-label="t('carePlanActionView')"
                  @click="emit('view', goal)"
                />
                <q-btn
                  v-if="!readonly"
                  flat
                  round
                  size="sm"
                  class="app-btn-icon-action"
                  color="primary"
                  icon="edit"
                  :aria-label="t('edit')"
                  @click="emit('edit', goal)"
                />
                <q-btn
                  v-if="!readonly"
                  flat
                  round
                  size="sm"
                  class="app-btn-icon-action"
                  color="primary"
                  icon="delete"
                  :aria-label="t('delete')"
                  @click="emit('delete', goal)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="care-plan-goals-empty text-center q-pa-lg">
      <q-icon name="track_changes" size="40px" color="grey-5" />
      <p class="text-body2 text-grey-7 q-mt-sm q-mb-none">
        {{ t('carePlanGoalsEmpty') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import CarePlanProgressCell from 'components/CarePlanProgressCell.vue'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'

defineProps({
  goals: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['add', 'view', 'edit', 'delete'])

const { t } = useI18n()

function goalStatusLabel(status) {
  const key = carePlanI18nKey('carePlanGoalStatus', status)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return status || '—'
}
</script>

<style lang="scss" scoped>
.care-plan-goal-status-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.care-plan-goal-status-badge--IN_PROGRESS {
  background: #dcfce7;
  color: #166534;
}

.care-plan-goal-status-badge--COMPLETED {
  background: #e0e7ff;
  color: #3730a3;
}

.care-plan-goal-status-badge--CANCELLED {
  background: #fee2e2;
  color: #b91c1c;
}
</style>
