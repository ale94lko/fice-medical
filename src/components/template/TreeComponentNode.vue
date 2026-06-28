<template>
  <div
    class="tree-component__branch"
    :class="{ 'tree-component__branch--nested': depth > 0 }">
    <div
      class="tree-component__row"
      :class="{
        'tree-component__row--parent': hasChildren,
        'tree-component__row--leaf': !hasChildren,
      }">
      <button
        v-if="hasChildren"
        type="button"
        class="tree-component__expand-btn"
        :aria-expanded="expanded ? 'true' : 'false'"
        :aria-label="expanded ? collapseLabel : expandLabel"
        :disabled="readonly"
        @click="expanded = !expanded">
        <q-icon
          name="chevron_right"
          size="18px"
          class="tree-component__expand-icon"
          :class="{ 'tree-component__expand-icon--open': expanded }"
        />
      </button>
      <span
        v-else
        class="tree-component__expand-spacer"
        aria-hidden="true"
      />

      <q-checkbox
        v-if="hasChildren"
        dense
        :model-value="parentCheckboxValue"
        true-value="checked"
        false-value="unchecked"
        indeterminate-value="indeterminate"
        toggle-indeterminate
        toggle-order="ft"
        :disable="readonly"
        color="primary"
        keep-color
        indeterminate-icon="remove"
        class="tree-component__checkbox tree-component__checkbox--parent"
        :data-testid="nodeTestId"
        @update:model-value="onParentToggle"
      />

      <q-checkbox
        v-else
        dense
        :model-value="checkState === 'checked'"
        :disable="readonly"
        color="primary"
        class="tree-component__checkbox"
        :data-testid="nodeTestId"
        @update:model-value="onToggle(Boolean($event))"
      />

      <button
        type="button"
        class="tree-component__label-btn"
        :class="{
          'tree-component__label-btn--parent': hasChildren,
        }"
        :disabled="readonly && !hasChildren"
        @click="onLabelClick">
        <span class="tree-component__label">{{ node.label }}</span>
        <span
          v-if="hasChildren"
          class="tree-component__count">
          {{ selectedLeafCount }}/{{ leafValues.length }}
        </span>
      </button>
    </div>

    <div
      v-if="hasChildren && expanded"
      class="tree-component__children">
      <TreeComponentNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :model-value="modelValue"
        :readonly="readonly"
        :depth="depth + 1"
        :test-id-prefix="testIdPrefix"
        :expand-label="expandLabel"
        :collapse-label="collapseLabel"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  collectLeafValues,
  getBranchCheckState,
  toggleBranchSelection,
  toggleLeafSelection,
} from 'src/utils/tree-selection.js'

defineOptions({
  name: 'TreeComponentNode',
})

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  depth: {
    type: Number,
    default: 0,
  },
  testIdPrefix: {
    type: String,
    default: 'tree-component',
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

const expanded = ref(props.depth === 0)

const hasChildren = computed(
  () => Array.isArray(props.node?.children) && props.node.children.length > 0,
)

const leafValues = computed(() => collectLeafValues(props.node))

const selectedSet = computed(
  () => new Set((props.modelValue ?? []).map(value => String(value))),
)

const checkState = computed(() => {
  if (!hasChildren.value && props.node?.value != null) {
    return selectedSet.value.has(String(props.node.value))
      ? 'checked'
      : 'unchecked'
  }

  return getBranchCheckState(props.node, selectedSet.value)
})

const parentCheckboxValue = computed(() => checkState.value)

const selectedLeafCount = computed(
  () => leafValues.value.filter(
    value => selectedSet.value.has(String(value)),
  ).length,
)

const nodeTestId = computed(() => {
  const suffix = hasChildren.value
    ? `branch-${props.node.id}`
    : `leaf-${props.node.id}`

  return `${props.testIdPrefix}-${suffix}`
})

function onParentToggle(value) {
  if (props.readonly) {
    return
  }
  onToggle(value === 'checked')
}

function onToggle(checked) {
  if (props.readonly) {
    return
  }
  if (hasChildren.value) {
    const next = toggleBranchSelection(
      props.node,
      props.modelValue ?? [],
      checked,
    )
    emit('update:modelValue', next)

    return
  }
  if (props.node?.value == null) {
    return
  }
  const next = toggleLeafSelection(
    String(props.node.value),
    props.modelValue ?? [],
    checked,
  )
  emit('update:modelValue', next)
}

function onLabelClick() {
  if (hasChildren.value) {
    expanded.value = !expanded.value

    return
  }
  if (props.readonly) {
    return
  }
  onToggle(checkState.value !== 'checked')
}
</script>
