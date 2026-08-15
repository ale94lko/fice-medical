<template>
  <div
    class="dashboard-widget-card"
    :class="{
      'dashboard-widget-card--edit': editMode,
      'dashboard-widget-card--edit-mobile': showInCardVisibility,
      'dashboard-widget-card--hidden': editMode && !visible,
      'dashboard-widget-card--dragging': dragging,
    }"
    :draggable="canDragReorder"
    @dragstart="onDragStart"
    @dragend="emit('drag-end')"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop">
    <div
      v-if="showToolbar"
      class="dashboard-widget-card__toolbar row items-center no-wrap"
      @mousedown.stop
      @click.stop
      @dragstart.stop.prevent>
      <span
        class="dashboard-widget-card__handle"
        :data-testid="dashboardTestIds.cardDrag(widgetId)"
        :aria-label="t('dashboardDragHandle')">
        <q-icon name="drag_indicator" size="20px" />
        <q-tooltip
          class="app-info-tooltip"
          anchor="top middle"
          self="bottom middle"
          :offset="[0, 6]">
          {{ t('dashboardDragHandle') }}
        </q-tooltip>
      </span>

      <FormSelect
        :model-value="size"
        :options="sizeOptions"
        emit-value
        map-options
        dense
        outlined
        hide-bottom-space
        :clearable="false"
        class="dashboard-widget-card__size"
        :test-id="dashboardTestIds.cardSize(widgetId)"
        @update:model-value="onSize"
      />

      <FormToggle
        :model-value="visible"
        :label="visible
          ? t('dashboardWidgetVisible')
          : t('dashboardWidgetHidden')"
        class="dashboard-widget-card__toggle"
        :test-id="dashboardTestIds.cardVisible(widgetId)"
        @update:model-value="onVisible"
      />
    </div>

    <div class="dashboard-widget-card__body">
      <div
        v-if="showInCardVisibility"
        class="dashboard-widget-card__visibility-in-card"
        @mousedown.stop
        @click.stop
        @dragstart.stop.prevent>
        <FormToggle
          :model-value="visible"
          :aria-label="visible
            ? t('dashboardWidgetVisible')
            : t('dashboardWidgetHidden')"
          :test-id="dashboardTestIds.cardVisible(widgetId)"
          @update:model-value="onVisible"
        />
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import { useViewportLayout } from 'src/composables/useViewportLayout.js'
import { dashboardTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  widgetId: {
    type: String,
    required: true,
  },
  editMode: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'M',
  },
  visible: {
    type: Boolean,
    default: true,
  },
  dragging: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:size',
  'update:visible',
  'drag-start',
  'drag-end',
  'drag-over',
  'drop',
])

const { t } = useI18n()
const { isMobile } = useViewportLayout()

const showToolbar = computed(
  () => props.editMode && !isMobile.value,
)

const showInCardVisibility = computed(
  () => props.editMode && isMobile.value,
)

const canDragReorder = computed(
  () => props.editMode && !isMobile.value,
)

const sizeOptions = computed(() => [
  { label: t('dashboardSizeS'), value: 'S' },
  { label: t('dashboardSizeM'), value: 'M' },
  { label: t('dashboardSizeL'), value: 'L' },
])

function onSize(value) {
  emit('update:size', value || 'M')
}

function onVisible(value) {
  emit('update:visible', Boolean(value))
}

function onDragOver(event) {
  if (!canDragReorder.value) {
    return
  }
  emit('drag-over', event)
}

function onDrop() {
  if (!canDragReorder.value) {
    return
  }
  emit('drop')
}

function onDragStart(event) {
  if (!canDragReorder.value) {
    return
  }
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.widgetId)
  }
  emit('drag-start', props.widgetId)
}
</script>
