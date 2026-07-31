<template>
  <q-page
    class="admin-page admin-list-page dashboard-page"
    :class="{
      'dashboard-page--empty': !hasAssignedPermissions,
      'dashboard-page--edit': editMode,
    }"
    :data-testid="dashboardTestIds.page">
    <div
      v-if="!hasAssignedPermissions"
      class="dashboard-page__no-access text-center q-pa-xl"
      :data-testid="dashboardTestIds.noAccess">
      <q-icon name="lock" size="48px" color="grey-6" class="q-mb-md" />
      <h1 class="text-h6 text-grey-8 q-mb-sm">
        {{ t('noPermissionsTitle') }}
      </h1>
      <p class="text-body1 text-grey-7 q-mb-none">
        {{ t('noPermissionsMessage') }}
      </p>
    </div>

    <template v-else>
      <AppLoadingOverlay
        scope="content"
        :showing="loading"
      />

      <AdminListPageHeader
        :title="t('dashboard')"
        :subtitle="editMode
          ? t('dashboardEditSubtitle')
          : t('dashboardSubtitle')">
        <template #actions>
          <div
            class="admin-list-page__actions row items-center
              q-gutter-sm no-wrap">
            <q-btn
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="refresh"
              :disable="loading"
              :data-testid="dashboardTestIds.refresh"
              :label="t('dashboardRefresh')"
              @click="loadDashboard"
            />
            <q-btn
              no-caps
              unelevated
              color="primary"
              class="app-btn-primary"
              :icon="editMode ? 'check' : 'tune'"
              :disable="loading"
              :data-testid="dashboardTestIds.customize"
              :label="editMode
                ? t('dashboardDoneEditing')
                : t('dashboardCustomize')"
              @click="toggleEditMode"
            />
          </div>
        </template>
      </AdminListPageHeader>

      <div
        v-if="!loading && !displayItems.length"
        class="dashboard-page__empty text-center q-pa-xl"
        :data-testid="dashboardTestIds.empty">
        <q-icon
          name="dashboard_customize"
          size="48px"
          color="grey-6"
          class="q-mb-md"
        />
        <h2 class="text-h6 text-grey-8 q-mb-sm">
          {{ t('dashboardEmptyTitle') }}
        </h2>
        <p class="text-body1 text-grey-7 q-mb-md">
          {{ t('dashboardEmptyMessage') }}
        </p>
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="tune"
          :label="t('dashboardCustomize')"
          @click="toggleEditMode"
        />
      </div>

      <div
        v-else
        ref="gridEl"
        class="dashboard-page__grid row q-col-gutter-md"
        :data-testid="dashboardTestIds.grid">
        <div
          v-for="(item, index) in displayItems"
          :key="item.id"
          :class="widgetGridColClass(item.size)">
          <DashboardWidgetCard
            :widget-id="item.id"
            :edit-mode="editMode"
            :size="item.size"
            :visible="item.visible"
            :dragging="dragSourceId === item.id"
            @update:size="value => onCardSize(item.id, value)"
            @update:visible="value => onCardVisible(item.id, value)"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
            @drag-over="event => onDragOver(index, event)"
            @drop="onDragEnd">
            <DashboardWidget
              v-if="item.widget"
              :widget="item.widget"
              @navigate="onNavigate"
            />
            <article
              v-else
              class="dashboard-widget dashboard-widget--placeholder">
              <h2 class="dashboard-widget__title q-mb-none">
                {{ item.label }}
              </h2>
              <p class="dashboard-widget__description q-mb-none">
                {{ t('dashboardWidgetHiddenHint') }}
              </p>
            </article>
          </DashboardWidgetCard>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import DashboardWidget from 'components/dashboard/DashboardWidget.vue'
import DashboardWidgetCard from
  'components/dashboard/DashboardWidgetCard.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import {
  fetchDashboard,
  fetchDashboardConfig,
  saveDashboardConfig,
} from 'src/utils/dashboard-api.js'
import { createDragAutoScroll } from
  'src/utils/dashboard-drag-auto-scroll.js'
import {
  dashboardWidgetI18nSuffix,
  widgetGridColClass,
} from 'src/utils/dashboard-normalize.js'
import { useAuthStore } from 'stores/auth-store.js'
import { dashboardTestIds } from 'src/test-ids/index.js'

const { t, te } = useI18n()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const hasAssignedPermissions = computed(
  () => authStore.hasAssignedPermissions,
)

const loading = ref(false)
const editMode = ref(false)
const widgets = ref([])
const configWidgets = ref([])
const gridEl = ref(null)
const dragSourceId = ref(null)
const lastReorderHover = ref(null)
const dragOrderDirty = ref(false)
const dragAutoScroll = createDragAutoScroll()
let persistSeq = 0

function widgetLabel(widgetId, fallback = '') {
  if (fallback) {
    return fallback
  }
  const key = `dashboardWidget${dashboardWidgetI18nSuffix(widgetId)}Label`
  if (te(key)) {
    return t(key)
  }

  return widgetId
}

function cloneConfig(list) {
  return (list || []).map(item => ({ ...item }))
}

function buildConfigFromWidgets(list) {
  return (list || []).map((widget, index) => ({
    id: widget.id,
    label: widget.label,
    description: widget.description,
    category: widget.category,
    type: widget.type,
    status: widget.status,
    permissionOk: widget.permissionOk,
    visible: widget.visible !== false,
    order: widget.order ?? ((index + 1) * 10),
    size: widget.size || 'M',
  }))
}

function sortConfig(list) {
  return cloneConfig(list).sort((a, b) => {
    const aHidden = a.visible === false ? 1 : 0
    const bHidden = b.visible === false ? 1 : 0
    if (aHidden !== bHidden) {
      return aHidden - bHidden
    }

    return a.order - b.order || a.id.localeCompare(b.id)
  })
}

function withReindexedOrder(list) {
  return list.map((item, index) => ({
    ...item,
    order: (index + 1) * 10,
  }))
}

function moveHiddenToEnd(list) {
  const visible = []
  const hidden = []
  ;(list || []).forEach((item) => {
    if (item.visible === false) {
      hidden.push(item)
    } else {
      visible.push(item)
    }
  })

  return withReindexedOrder([...visible, ...hidden])
}

const displayItems = computed(() => {
  const dataById = new Map(
    (widgets.value || []).map(widget => [widget.id, widget]),
  )

  if (editMode.value) {
    const config = sortConfig(configWidgets.value)
    if (!config.length) {
      return (widgets.value || []).map(widget => ({
        id: widget.id,
        label: widgetLabel(widget.id, widget.label),
        size: widget.size || 'M',
        visible: true,
        widget: {
          ...widget,
          size: widget.size || 'M',
          visible: true,
        },
      }))
    }

    return config.map((cfg) => {
      const data = dataById.get(cfg.id)
      const size = cfg.size || 'M'
      const visible = cfg.visible !== false

      return {
        id: cfg.id,
        label: widgetLabel(cfg.id, cfg.label || data?.label),
        size,
        visible,
        widget: data
          ? { ...data, size, visible }
          : null,
      }
    })
  }

  return (widgets.value || []).map(widget => ({
    id: widget.id,
    label: widgetLabel(widget.id, widget.label),
    size: widget.size || 'M',
    visible: true,
    widget,
  }))
})

async function loadDashboard() {
  if (!hasAssignedPermissions.value) {
    return
  }
  loading.value = true
  try {
    const [dashboard, config] = await Promise.all([
      fetchDashboard({ includeHidden: false }),
      fetchDashboardConfig().catch(() => ({ widgets: [] })),
    ])
    widgets.value = dashboard.widgets || []
    configWidgets.value = config.widgets?.length
      ? moveHiddenToEnd(config.widgets)
      : buildConfigFromWidgets(dashboard.widgets)
  } catch {
    widgets.value = []
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('dashboardLoadError'),
    })
  } finally {
    loading.value = false
  }
}

async function ensureConfigLoaded() {
  if (configWidgets.value.length) {
    return
  }
  try {
    const config = await fetchDashboardConfig()
    configWidgets.value = config.widgets?.length
      ? moveHiddenToEnd(config.widgets)
      : buildConfigFromWidgets(widgets.value)
  } catch {
    configWidgets.value = buildConfigFromWidgets(widgets.value)
  }
}

async function toggleEditMode() {
  if (editMode.value) {
    editMode.value = false
    dragSourceId.value = null
    await loadDashboard()
    return
  }
  await ensureConfigLoaded()
  try {
    const dashboard = await fetchDashboard({ includeHidden: true })
    widgets.value = dashboard.widgets || []
  } catch {
    // Keep currently loaded widgets if the expand fetch fails.
  }
  editMode.value = true
}

async function persistConfig(nextConfig) {
  const snapshot = cloneConfig(configWidgets.value)
  const payload = moveHiddenToEnd(nextConfig)
  configWidgets.value = payload
  const seq = ++persistSeq
  try {
    const saved = await saveDashboardConfig(payload)
    if (seq !== persistSeq) {
      return
    }
    if (saved.widgets?.length) {
      configWidgets.value = moveHiddenToEnd(saved.widgets)
    }
  } catch {
    if (seq !== persistSeq) {
      return
    }
    configWidgets.value = snapshot
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('dashboardConfigSaveError'),
    })
  }
}

function onCardSize(widgetId, size) {
  const next = cloneConfig(configWidgets.value)
  const row = next.find(item => item.id === widgetId)
  if (!row || row.size === size) {
    return
  }
  row.size = size
  const data = widgets.value.find(item => item.id === widgetId)
  if (data) {
    data.size = size
  }
  void persistConfig(next)
}

function onCardVisible(widgetId, visible) {
  const next = cloneConfig(configWidgets.value)
  const row = next.find(item => item.id === widgetId)
  if (!row || row.visible === visible) {
    return
  }
  row.visible = visible
  void persistConfig(moveHiddenToEnd(next))
}

function onDragStart(widgetId) {
  dragSourceId.value = widgetId
  lastReorderHover.value = null
  dragOrderDirty.value = false
  const anchor = gridEl.value?.closest('.dashboard-page')
    || gridEl.value
  dragAutoScroll.start(anchor)
}

function onDragEnd() {
  const shouldPersist = dragOrderDirty.value
  dragSourceId.value = null
  lastReorderHover.value = null
  dragOrderDirty.value = false
  dragAutoScroll.stop()
  if (shouldPersist) {
    void persistConfig(configWidgets.value)
  }
}

function onDragOver(hoverIndex, event) {
  if (!editMode.value || !dragSourceId.value) {
    return
  }
  dragAutoScroll.updateFromClientY(event?.clientY)
  const order = sortConfig(configWidgets.value)
  const fromIndex = order.findIndex(item => item.id === dragSourceId.value)
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
  if (targetIndex === fromIndex || targetIndex < 0) {
    return
  }
  const hoverKey = `${dragSourceId.value}:${targetIndex}`
  if (lastReorderHover.value === hoverKey) {
    return
  }
  lastReorderHover.value = hoverKey
  const next = [...order]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(targetIndex, 0, moved)
  configWidgets.value = withReindexedOrder(
    moveHiddenToEnd(next),
  )
  dragOrderDirty.value = true
}

function onNavigate(target) {
  if (editMode.value || !target) {
    return
  }
  if (typeof target === 'string') {
    void router.push(target)
    return
  }
  void router.push(target)
}

onMounted(() => {
  void loadDashboard()
})

onUnmounted(() => {
  dragAutoScroll.stop()
})
</script>
