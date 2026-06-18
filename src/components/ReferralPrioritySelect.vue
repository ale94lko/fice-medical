<template>
  <q-select
    :model-value="modelValue"
    outlined
    hide-bottom-space
    emit-value
    map-options
    :readonly="readonly"
    :disable="disable"
    :options="options"
    :data-testid="testId || undefined"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #selected>
      <span
        v-if="modelValue"
        class="referral-priority-select__value row items-center no-wrap">
        <span
          class="referral-priority-dot"
          :class="dotClass(modelValue)"
        />
        {{ labelFor(modelValue) }}
      </span>
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <span
            class="referral-priority-dot"
            :class="dotClass(scope.opt.value)"
          />
        </q-item-section>
        <q-item-section>{{ scope.opt.label }}</q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { referralPriorities } from 'components/constants.js'
import { referralI18nKey } from 'src/utils/referral-i18n.js'

defineProps({
  modelValue: {
    type: String,
    default: referralPriorities.routine,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  disable: {
    type: Boolean,
    default: false,
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

function labelFor(value) {
  const key = referralI18nKey('referralPriority', value)
  const translated = t(key)

  return translated !== key ? translated : value
}

const options = [
  referralPriorities.routine,
  referralPriorities.urgent,
  referralPriorities.stat,
].map(value => ({
  label: labelFor(value),
  value,
}))

function dotClass(value) {
  const token = String(value ?? '').toUpperCase()
  if (token === referralPriorities.stat) {
    return 'referral-priority-dot--urgent'
  }
  if (token === referralPriorities.urgent) {
    return 'referral-priority-dot--high'
  }

  return 'referral-priority-dot--medium'
}
</script>

<style lang="scss" scoped>
.referral-priority-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.referral-priority-dot--medium {
  background: #eab308;
}

.referral-priority-dot--high {
  background: #f97316;
}

.referral-priority-dot--urgent {
  background: #ef4444;
}

.referral-priority-select__value {
  min-height: 24px;
}
</style>
