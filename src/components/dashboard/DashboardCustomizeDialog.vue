<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="app-dialog-card dashboard-customize-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        :info="t('dashboardCustomizeHint')"
        @close="onCancel">
        {{ t('dashboardCustomizeTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <TransitionGroup
          name="dashboard-customize-list"
          tag="div"
          class="dashboard-customize">
          <div
            v-for="(widgetId, index) in draftOrder"
            :key="widgetId"
            class="dashboard-customize__card"
            :class="{
              'dashboard-customize__card--dragging':
                dragSourceId === widgetId,
            }"
            draggable="true"
            @dragstart="onDragStart(widgetId, $event)"
            @dragend="onDragEnd"
            @dragover.prevent="onDragOver(index, $event)"
            @drop.prevent="onDragEnd">
            <div
              class="dashboard-customize__toggle-wrap"
              @mousedown.stop
              @dragstart.stop.prevent>
              <FormToggle
                :model-value="!draftHidden.includes(widgetId)"
                :label="widgetLabel(widgetId)"
                class="dashboard-customize__toggle"
                :test-id="dashboardTestIds.customizeToggle(widgetId)"
                @update:model-value="value => onToggle(widgetId, value)"
              />
            </div>
            <FormSelect
              :model-value="draftSizes[widgetId] || 'M'"
              :options="sizeOptions"
              emit-value
              map-options
              dense
              outlined
              hide-bottom-space
              :clearable="false"
              class="dashboard-customize__size"
              :test-id="dashboardTestIds.customizeSize(widgetId)"
              @update:model-value="value => onSize(widgetId, value)"
              @mousedown.stop
              @dragstart.stop.prevent
            />
            <span
              class="dashboard-customize__handle"
              aria-hidden="true">
              <q-icon name="drag_indicator" size="22px" />
            </span>
          </div>
        </TransitionGroup>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          :data-testid="dashboardTestIds.customizeCancel"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('save')"
          :loading="saving"
          :data-testid="dashboardTestIds.customizeSave"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import { dashboardWidgetI18nSuffix } from 'src/utils/dashboard-normalize.js'
import { dashboardTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  widgets: {
    type: Array,
    default: () => [],
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t, te } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const draftOrder = ref([])
const draftHidden = ref([])
const draftSizes = ref({})
const dragSourceId = ref(null)
const lastReorderHover = ref(null)

const sizeOptions = computed(() => [
  { label: t('dashboardSizeS'), value: 'S' },
  { label: t('dashboardSizeM'), value: 'M' },
  { label: t('dashboardSizeL'), value: 'L' },
])

const widgetById = computed(() => {
  const map = {}
  ;(props.widgets ?? []).forEach((widget) => {
    map[widget.id] = widget
  })

  return map
})

function syncDraftFromProps() {
  const list = [...(props.widgets ?? [])]
    .slice()
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  draftOrder.value = list.map(widget => widget.id)
  draftHidden.value = list
    .filter(widget => widget.visible === false)
    .map(widget => widget.id)
  const sizes = {}
  list.forEach((widget) => {
    sizes[widget.id] = widget.size || 'M'
  })
  draftSizes.value = sizes
  dragSourceId.value = null
  lastReorderHover.value = null
}

watch(
  () => [props.modelValue, props.widgets],
  ([visible]) => {
    if (!visible) {
      return
    }
    syncDraftFromProps()
  },
  { immediate: true, deep: true },
)

function widgetLabel(widgetId) {
  const widget = widgetById.value[widgetId]
  if (widget?.label) {
    return widget.label
  }
  const key = `dashboardWidget${
    dashboardWidgetI18nSuffix(widgetId)
  }Label`
  if (te(key)) {
    return t(key)
  }

  return widgetId
}

function onToggle(widgetId, visible) {
  if (visible) {
    draftHidden.value = draftHidden.value.filter(id => id !== widgetId)
    return
  }
  if (!draftHidden.value.includes(widgetId)) {
    draftHidden.value = [...draftHidden.value, widgetId]
  }
}

function onSize(widgetId, size) {
  draftSizes.value = {
    ...draftSizes.value,
    [widgetId]: size || 'M',
  }
}

function onDragStart(widgetId, event) {
  dragSourceId.value = widgetId
  lastReorderHover.value = null
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', widgetId)
  }
}

function onDragEnd() {
  dragSourceId.value = null
  lastReorderHover.value = null
}

function onDragOver(hoverIndex, event) {
  if (!dragSourceId.value) {
    return
  }
  const order = [...draftOrder.value]
  const fromIndex = order.indexOf(dragSourceId.value)
  if (fromIndex < 0) {
    return
  }
  const after = Boolean(
    event?.offsetY > (event?.currentTarget?.offsetHeight || 0) / 2,
  )
  let rawInsert = after ? hoverIndex + 1 : hoverIndex
  let targetIndex = rawInsert
  if (fromIndex < targetIndex) {
    targetIndex -= 1
  }
  if (targetIndex === fromIndex) {
    return
  }
  const hoverKey = `${dragSourceId.value}:${targetIndex}`
  if (lastReorderHover.value === hoverKey) {
    return
  }
  lastReorderHover.value = hoverKey
  const [moved] = order.splice(fromIndex, 1)
  order.splice(targetIndex, 0, moved)
  draftOrder.value = order
}

function onCancel() {
  open.value = false
}

function onSave() {
  const widgets = draftOrder.value.map((id, index) => ({
    id,
    visible: !draftHidden.value.includes(id),
    order: (index + 1) * 10,
    size: draftSizes.value[id] || 'M',
  }))
  emit('save', widgets)
}
</script>
