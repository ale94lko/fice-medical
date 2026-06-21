<template>
  <div class="care-plan-progress-cell">
    <template v-if="compact">
      <template v-if="isMeasured">
        <div
          class="care-plan-progress-cell__percent"
          :class="`care-plan-progress-cell__percent--${colorToken}`">
          {{ Math.round(percent) }}%
        </div>
        <q-linear-progress
          :value="percent / 100"
          :color="barColor"
          track-color="grey-3"
          rounded
          size="6px"
          class="care-plan-progress-cell__bar q-mt-xs"
        />
      </template>
      <span
        v-else-if="isAchieved"
        class="text-positive text-weight-medium">
        {{ t('carePlanProgressAchieved') }}
      </span>
      <span v-else class="text-grey-6">
        {{ t('carePlanProgressNotMeasured') }}
      </span>
    </template>
    <template v-else-if="isMeasured">
      <div
        class="care-plan-progress-cell__percent"
        :class="`care-plan-progress-cell__percent--${colorToken}`">
        {{ Math.round(percent) }}%
      </div>
      <q-linear-progress
        :value="percent / 100"
        :color="barColor"
        track-color="grey-3"
        rounded
        size="8px"
        class="q-mt-xs"
      />
      <p
        v-if="subLabel"
        class="care-plan-progress-cell__sub text-caption text-grey-6
          q-mb-none q-mt-xs">
        {{ subLabel }}
      </p>
    </template>
    <template v-else-if="isAchieved">
      <div class="row items-center no-wrap text-positive">
        <q-icon name="check_circle" size="18px" class="q-mr-xs" />
        <span class="text-weight-medium">
          {{ t('carePlanProgressAchieved') }}
        </span>
      </div>
      <p class="text-caption text-grey-6 q-mb-none q-mt-xs">
        {{ t('carePlanProgressAllGoalsAchieved') }}
      </p>
    </template>
    <template v-else>
      <div class="row items-center no-wrap text-grey-6">
        <q-icon name="fiber_manual_record" size="10px" class="q-mr-xs" />
        <span>{{ t('carePlanProgressNotMeasured') }}</span>
      </div>
      <p
        v-if="goalsCount > 0"
        class="text-caption text-grey-6 q-mb-none q-mt-xs">
        {{
          t('carePlanProgressGoalsMeasured', {
            measured: 0,
            total: goalsCount,
          })
        }}
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { carePlanProgressStatuses } from 'components/constants.js'
import { progressBarColor } from 'src/utils/care-plan-progress.js'

const props = defineProps({
  progress: {
    type: Object,
    default: () => ({ status: 'NOT_MEASURED', percent: null }),
  },
  goalsCount: {
    type: Number,
    default: 0,
  },
  subLabel: {
    type: String,
    default: '',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

const percent = computed(() => Number(props.progress?.percent ?? 0))
const isMeasured = computed(
  () => props.progress?.status === carePlanProgressStatuses.measured
    && props.progress?.percent != null
    && props.progress.percent < 100,
)
const isAchieved = computed(
  () => props.progress?.status === carePlanProgressStatuses.measured
    && props.progress?.percent >= 100,
)
const barColor = computed(() => progressBarColor(percent.value))
const colorToken = computed(() => {
  if (percent.value >= 75) {
    return 'high'
  }
  if (percent.value >= 40) {
    return 'mid'
  }

  return 'low'
})
</script>

<style lang="scss" scoped>
.care-plan-progress-cell__percent {
  font-weight: 700;
  font-size: 0.875rem;
  line-height: 1.2;
}

.care-plan-progress-cell__bar {
  min-width: 72px;
  max-width: 120px;
}

.care-plan-progress-cell__percent--low {
  color: #b91c1c;
}

.care-plan-progress-cell__percent--mid {
  color: #c2410c;
}

.care-plan-progress-cell__percent--high {
  color: #166534;
}
</style>
