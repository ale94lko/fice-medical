<template>
  <div
    v-if="selectedCount"
    class="role-multi-select-chips"
    :data-testid="`${testId}-chips`">
    <span
      v-for="role in selectedRoleOptions"
      :key="role.value"
      class="role-multi-select-chips__chip"
      :data-testid="`${testId}-chip-${role.value}`">
      <span
        class="role-multi-select-chips__chip-icon"
        aria-hidden="true">
        <q-icon
          :name="roleIcon(role)"
          size="16px"
        />
      </span>
      <span class="role-multi-select-chips__chip-label">
        {{ roleLabel(role) }}
      </span>
      <button
        v-if="!readonly"
        type="button"
        class="role-multi-select-chips__chip-remove"
        :aria-label="removeRoleLabel(role)"
        :data-testid="`${testId}-chip-remove-${role.value}`"
        @click="removeRole(role.value)">
        <q-icon name="close" size="12px" />
      </button>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  formatRoleLabel,
  resolveRoleIcon,
} from 'src/utils/tenant-roles-api.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  options: {
    type: Array,
    default: () => [],
  },
  readonly: {
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

const selectedCount = computed(() => (props.modelValue ?? []).length)

const selectedRoleOptions = computed(() => {
  const optionMap = new Map(
    props.options.map(option => [Number(option.value), option]),
  )

  return (props.modelValue ?? [])
    .map(value => optionMap.get(Number(value)))
    .filter(Boolean)
})

function roleLabel(option) {
  return formatRoleLabel(option?.label ?? option?.name ?? '')
}

function roleIcon(option) {
  return option?.icon || resolveRoleIcon(roleLabel(option))
}

function removeRoleLabel(role) {
  return t('userRolesRemoveRole', { role: roleLabel(role) })
}

function removeRole(roleId) {
  if (props.readonly) {
    return
  }

  const next = (props.modelValue ?? []).filter(
    value => Number(value) !== Number(roleId),
  )
  emit('update:modelValue', next)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.role-multi-select-chips {
  display: block;
  width: 100%;
  margin-top: 10px;
  line-height: 0;

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
    min-height: 34px;
    margin: 0 8px 8px 0;
    padding: 4px 8px 4px 6px;
    border: 1px solid rgba($primary, 0.22);
    border-radius: 8px;
    background: $secondary-2;
    color: $fice-teal-dark;
    line-height: 1.2;
    vertical-align: top;
    box-sizing: border-box;
  }

  &__chip-icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: $primary;
  }

  &__chip-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    line-height: 1.2;
  }

  &__chip-remove {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-left: 2px;
    padding: 0;
    border: 1px solid rgba($text-muted, 0.35);
    border-radius: 50%;
    background: #fff;
    color: $text-muted;
    cursor: pointer;
  }

  &__chip-remove:hover {
    color: $text-strong;
    border-color: rgba($text-strong, 0.35);
  }
}
</style>
