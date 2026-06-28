<template>
  <div
    class="tree-component"
    :class="{
      'tree-component--readonly': readonly,
      'tree-component--loading': loading,
    }"
    :data-testid="testId">
    <div
      v-if="loading"
      class="tree-component__state tree-component__state--loading">
      <q-spinner color="primary" size="28px" />
      <span>{{ loadingLabel }}</span>
    </div>

    <div
      v-else-if="!nodes.length"
      class="tree-component__state tree-component__state--empty">
      <q-icon name="folder_off" size="22px" />
      <span>{{ emptyLabel }}</span>
    </div>

    <div
      v-else
      class="tree-component__panel">
      <TreeComponentNode
        v-for="node in nodes"
        :key="node.id"
        :node="node"
        :model-value="modelValue"
        :readonly="readonly"
        :test-id-prefix="testId"
        :expand-label="expandLabel"
        :collapse-label="collapseLabel"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import TreeComponentNode from 'components/template/TreeComponentNode.vue'

defineProps({
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
    default: 'tree-component',
  },
  emptyLabel: {
    type: String,
    default: 'No items available.',
  },
  loadingLabel: {
    type: String,
    default: 'Loading…',
  },
  expandLabel: {
    type: String,
    default: 'Expand',
  },
  collapseLabel: {
    type: String,
    default: 'Collapse',
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.tree-component {
  &__panel {
    max-height: 320px;
    overflow: auto;
    padding: 8px;
    border: 1px solid $border-subtle;
    border-radius: $radius-md;
    background: linear-gradient(
      180deg,
      $surface 0%,
      $surface-muted 100%
    );
    box-shadow: $shadow-sm;
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
}

:deep(.tree-component__branch + .tree-component__branch) {
  margin-top: 4px;
}

:deep(.tree-component__row) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

:deep(.tree-component__row:hover) {
  background: rgba($primary, 0.06);
}

:deep(.tree-component__row--parent) {
  font-weight: 600;
}

:deep(.tree-component__expand-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: $text-muted;
  cursor: pointer;
}

:deep(.tree-component__expand-btn:hover:not(:disabled)) {
  background: rgba($primary, 0.08);
  color: $primary;
}

:deep(.tree-component__expand-btn:disabled) {
  cursor: default;
  opacity: 0.55;
}

:deep(.tree-component__expand-icon) {
  transition: transform 0.18s ease;
}

:deep(.tree-component__expand-icon--open) {
  transform: rotate(90deg);
}

:deep(.tree-component__expand-spacer) {
  width: 28px;
  flex-shrink: 0;
}

:deep(.tree-component__checkbox .q-checkbox__inner) {
  font-size: 32px;
}

:deep(.tree-component__checkbox--parent .q-checkbox__inner--indet) {
  color: $primary;
}

:deep(.tree-component__label-btn) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: $text-strong;
}

:deep(.tree-component__label-btn--parent) {
  color: $primary;
}

:deep(.tree-component__label-btn:disabled) {
  cursor: default;
}

:deep(.tree-component__label) {
  font-size: 0.875rem;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.tree-component__count) {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba($primary, 0.1);
  color: $primary;
  font-size: 0.75rem;
  font-weight: 600;
}

:deep(.tree-component__children) {
  margin-left: 14px;
  border-left: 2px solid rgba($primary, 0.14);
}

:deep(.tree-component__branch--nested .tree-component__row--leaf) {
  .tree-component__label {
    color: $table-text-secondary;
    font-weight: 500;
    font-size: 0.8125rem;
  }
}
</style>
