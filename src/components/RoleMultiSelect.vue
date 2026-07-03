<template>
  <div class="role-multi-select">
    <q-select
      :model-value="modelValue"
      class="role-multi-select__field"
      popup-content-class="role-multi-select__popup"
      outlined
      hide-bottom-space
      multiple
      emit-value
      map-options
      option-value="value"
      option-label="label"
      lazy-rules="ondemand"
      :options="filteredOptions"
      :placeholder="placeholder"
      :disable="readonly"
      :loading="loading"
      :rules="rules"
      :data-testid="testId || undefined"
      @update:model-value="emit('update:modelValue', $event ?? [])">
      <template #selected>
        <span
          v-if="!selectedCount"
          class="role-multi-select__placeholder">
          {{ placeholder }}
        </span>
      </template>

      <template #before-options>
        <div class="role-multi-select__search-wrap">
          <q-input
            v-model="searchQuery"
            dense
            outlined
            hide-bottom-space
            class="role-multi-select__search"
            :placeholder="searchPlaceholder"
            :data-testid="`${testId}-search`"
            @keydown.stop
            @keyup.stop
            @keypress.stop>
            <template #prepend>
              <q-icon name="search" size="18px" />
            </template>
          </q-input>
        </div>
      </template>

      <template #option="scope">
        <q-item
          v-bind="scope.itemProps"
          class="role-multi-select__option"
          :class="{
            'role-multi-select__option--selected': scope.selected,
          }"
          :data-testid="`${testId}-option-${scope.opt.value}`">
          <q-item-section side class="role-multi-select__option-check">
            <q-checkbox
              dense
              color="primary"
              keep-color
              :model-value="scope.selected"
              :disable="readonly"
              @update:model-value="scope.toggleOption(scope.opt)"
              @click.stop
            />
          </q-item-section>
          <q-item-section avatar class="role-multi-select__option-avatar">
            <span
              class="role-multi-select__option-icon"
              aria-hidden="true">
              <q-icon
                :name="roleIcon(scope.opt)"
                size="18px"
              />
            </span>
          </q-item-section>
          <q-item-section>
            <q-item-label class="role-multi-select__option-label">
              {{ roleLabel(scope.opt) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <template #no-option>
        <q-item class="role-multi-select__empty">
          <q-item-section class="text-grey-7">
            {{ noResultsLabel }}
          </q-item-section>
        </q-item>
      </template>

      <template #after-options>
        <div
          v-if="options.length"
          class="role-multi-select__footer">
          <span class="role-multi-select__footer-count">
            {{ selectedCountLabel }}
          </span>
          <button
            type="button"
            class="role-multi-select__clear"
            :disabled="readonly || !selectedCount"
            :data-testid="`${testId}-clear-all`"
            @click.stop.prevent="clearAll">
            <span>{{ clearAllLabel }}</span>
            <q-icon name="delete_outline" size="16px" />
          </button>
        </div>
      </template>
    </q-select>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
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
  placeholder: {
    type: String,
    default: '',
  },
  searchPlaceholder: {
    type: String,
    default: '',
  },
  clearAllLabel: {
    type: String,
    default: '',
  },
  noResultsLabel: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const searchQuery = ref('')

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return props.options
  }

  return props.options.filter(option => {
    const label = roleLabel(option).toLowerCase()

    return label.includes(query)
  })
})

const selectedCount = computed(() => (props.modelValue ?? []).length)

const selectedCountLabel = computed(() =>
  t('userRolesSelectedCount', { count: selectedCount.value }),
)

const searchPlaceholder = computed(
  () => props.searchPlaceholder || t('userRolesSearchPlaceholder'),
)

const clearAllLabel = computed(
  () => props.clearAllLabel || t('userRolesClearAll'),
)

const noResultsLabel = computed(
  () => props.noResultsLabel || t('userRolesSearchEmpty'),
)

function roleLabel(option) {
  return formatRoleLabel(option?.label ?? option?.name ?? '')
}

function roleIcon(option) {
  return option?.icon || resolveRoleIcon(roleLabel(option))
}

function clearAll() {
  if (props.readonly) {
    return
  }
  emit('update:modelValue', [])
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.role-multi-select {
  width: 100%;

  &__field {
    :deep(.q-field__control) {
      min-height: 44px;
    }

    :deep(.q-field__native) {
      min-height: 24px;
      padding-top: 8px;
      padding-bottom: 8px;
    }
  }

  &__placeholder {
    color: $text-hint;
    font-size: 0.875rem;
  }

  &__search-wrap {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 10px 12px 8px;
    background: #fff;
    border-bottom: 1px solid $border-subtle;
  }

  &__search {
    :deep(.q-field__control) {
      min-height: 38px;
    }
  }

  &__option {
    min-height: 44px;
    padding: 4px 12px 4px 8px;
  }

  &__option--selected {
    background: rgba($primary, 0.08);
  }

  &__option-check {
    min-width: 32px;
    padding-right: 0;
  }

  &__option-avatar {
    min-width: 0;
    padding-right: 8px;
  }

  &__option-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba($primary, 0.12);
    color: $primary;
  }

  &__option-label {
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: $text-strong;
  }

  &__empty {
    min-height: 44px;
    font-size: 0.875rem;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-top: 1px solid $border-subtle;
    background: #fff;
  }

  &__footer-count {
    font-size: 0.8125rem;
    font-weight: 600;
    color: $primary;
  }

  &__clear {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: 0;
    background: transparent;
    color: $text-muted;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
  }

  &__clear:disabled {
    opacity: 0.45;
    cursor: default;
  }

  &__clear:not(:disabled):hover {
    color: $text-strong;
  }
}
</style>

<style lang="scss">
.role-multi-select__popup {
  .q-virtual-scroll__content {
    padding-top: 0;
  }
}
</style>
