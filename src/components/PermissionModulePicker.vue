<template>
  <div
    class="permission-module-picker"
    :class="{
      'permission-module-picker--readonly': readonly,
      'permission-module-picker--loading': loading,
    }"
    :data-testid="testId">
    <div
      v-if="loading"
      class="permission-module-picker__state">
      <q-spinner color="primary" size="28px" />
      <span>{{ loadingLabel }}</span>
    </div>

    <div
      v-else-if="!nodes.length"
      class="permission-module-picker__state">
      <q-icon name="folder_off" size="22px" />
      <span>{{ emptyLabel }}</span>
    </div>

    <div
      v-else
      class="permission-module-picker__panel">
      <div class="permission-module-picker__grid">
        <section
          v-for="module in nodes"
          :key="module.id"
          class="permission-module-picker__card">
          <div class="permission-module-picker__header">
            <q-checkbox
              dense
              :model-value="moduleCheckValue(module)"
              true-value="checked"
              false-value="unchecked"
              indeterminate-value="indeterminate"
              toggle-indeterminate
              toggle-order="ft"
              :disable="readonly"
              color="primary"
              keep-color
              indeterminate-icon="remove"
              class="permission-module-picker__module-checkbox"
              :data-testid="`${testId}-module-${module.id}`"
              @update:model-value="onModuleToggle(module, $event)"
            />
            <button
              type="button"
              class="permission-module-picker__header-main"
              :disabled="readonly"
              @click="toggleModuleExpanded(module.id)">
              <span
                class="permission-module-picker__icon"
                aria-hidden="true">
                <q-icon
                  :name="moduleIcon(module)"
                  size="18px"
                />
              </span>
              <span class="permission-module-picker__title">
                {{ module.label }}
              </span>
              <span class="permission-module-picker__badge">
                {{ selectedCount(module) }}/{{ leafCount(module) }}
              </span>
              <q-icon
                :name="isExpanded(module.id)
                  ? 'expand_less'
                  : 'expand_more'"
                size="20px"
                class="permission-module-picker__chevron"
              />
            </button>
          </div>

          <div
            v-if="isExpanded(module.id)"
            class="permission-module-picker__body">
            <label
              v-for="permission in module.children"
              :key="permission.id"
              class="permission-module-picker__permission">
              <q-checkbox
                dense
                :model-value="isPermissionSelected(permission)"
                :disable="readonly"
                color="primary"
                keep-color
                class="permission-module-picker__permission-checkbox"
                :data-testid="`${testId}-permission-${permission.id}`"
                @update:model-value="
                  onPermissionToggle(permission, Boolean($event))
                "
              />
              <span class="permission-module-picker__permission-label">
                {{ permissionLabel(permission) }}
                <q-tooltip
                  v-if="permissionDescription(permission)"
                  anchor="top middle"
                  self="bottom middle"
                  class="permission-module-picker__tooltip"
                  :offset="[0, 6]">
                  {{ permissionDescription(permission) }}
                </q-tooltip>
              </span>
            </label>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { resolvePermissionModuleIcon } from
  'src/utils/permission-tree-utils.js'
import {
  collectLeafValues,
  getBranchCheckState,
  toggleBranchSelection,
  toggleLeafSelection,
} from 'src/utils/tree-selection.js'

const props = defineProps({
  nodes: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  testId: {
    type: String,
    default: 'permission-module-picker',
  },
  emptyLabel: {
    type: String,
    default: 'No items available.',
  },
  loadingLabel: {
    type: String,
    default: 'Loading…',
  },
})

const emit = defineEmits(['update:modelValue'])

const expandedByModuleId = ref({})

const selectedSet = computed(
  () => new Set((props.modelValue ?? []).map(value => String(value))),
)

watch(
  () => props.nodes,
  nodes => {
    const next = { ...expandedByModuleId.value }
    for (const module of nodes ?? []) {
      if (next[module.id] == null) {
        next[module.id] = true
      }
    }
    expandedByModuleId.value = next
  },
  { immediate: true },
)

function isExpanded(moduleId) {
  return expandedByModuleId.value[moduleId] !== false
}

function toggleModuleExpanded(moduleId) {
  expandedByModuleId.value = {
    ...expandedByModuleId.value,
    [moduleId]: !isExpanded(moduleId),
  }
}

function moduleIcon(module) {
  return resolvePermissionModuleIcon(module?.moduleKey, module?.label)
}

function leafCount(module) {
  return collectLeafValues(module).length
}

function selectedCount(module) {
  return collectLeafValues(module).filter(
    value => selectedSet.value.has(String(value)),
  ).length
}

function moduleCheckValue(module) {
  return getBranchCheckState(module, selectedSet.value)
}

function isPermissionSelected(permission) {
  return selectedSet.value.has(String(permission.value))
}

function permissionLabel(permission) {
  const code = String(permission?.code ?? '').trim()

  return code || String(permission?.label ?? '').trim()
}

function permissionDescription(permission) {
  const description = String(permission?.description ?? '').trim()
  const label = String(permission?.label ?? '').trim()
  const code = permissionLabel(permission)

  if (description && description !== code) {
    return description
  }
  if (label && label !== code) {
    return label
  }

  return ''
}

function onModuleToggle(module, value) {
  if (props.readonly) {
    return
  }

  emit(
    'update:modelValue',
    toggleBranchSelection(
      module,
      props.modelValue ?? [],
      value === 'checked',
    ),
  )
}

function onPermissionToggle(permission, checked) {
  if (props.readonly || permission?.value == null) {
    return
  }

  emit(
    'update:modelValue',
    toggleLeafSelection(
      String(permission.value),
      props.modelValue ?? [],
      checked,
    ),
  )
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.permission-module-picker {
  &__panel {
    max-height: 420px;
    overflow: auto;
    padding: 4px;
    border: 1px solid $border-subtle;
    border-radius: $radius-md;
    background: $surface;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  &__card {
    border: 1px solid $border-subtle;
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    padding: 10px 10px 10px 8px;
  }

  &__header-main {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 auto;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
    color: $text-strong;
  }

  &__header-main:disabled {
    cursor: default;
  }

  &__module-checkbox {
    flex-shrink: 0;
    margin-top: 6px;
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba($primary, 0.12);
    color: $primary;
  }

  &__title {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.3;
  }

  &__badge {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba($primary, 0.1);
    color: $primary;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.4;
  }

  &__chevron {
    flex-shrink: 0;
    color: $grey-7;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 12px 12px 44px;
  }

  &__permission {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    cursor: pointer;
  }

  &__permission-label {
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.35;
    color: $text-strong;
    word-break: break-word;
    cursor: help;
  }

  &__state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 120px;
    padding: 16px;
    border: 1px dashed $table-border;
    border-radius: $radius-md;
    color: $text-muted;
    font-size: 0.875rem;
    background: $surface-muted;
  }

  &--readonly &__panel {
    background: $surface-muted;
  }

  @media (max-width: 767px) {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>

<style lang="scss">
@import 'src/css/quasar.variables';

.q-tooltip.permission-module-picker__tooltip {
  background: $white !important;
  color: $text-strong !important;
  font-size: 0.8125rem !important;
  font-weight: 400 !important;
  line-height: 1.45 !important;
  padding: 8px 12px !important;
  border: 1px solid $border-subtle;
  box-shadow: $shadow-sm;
  max-width: 300px;
}
</style>
