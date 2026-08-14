<template>
  <q-btn
    flat
    round
    dense
    icon="notifications"
    :aria-label="t('notificationsTitle')"
    :data-testid="layoutTestIds.notifications">
    <q-badge
      v-if="unreadCount"
      floating
      rounded
      color="negative"
      :label="unreadCount > 9 ? '9+' : unreadCount"
    />
    <q-menu
      ref="menuRef"
      class="app-light-menu app-header-notifications"
      anchor="bottom right"
      self="top right"
      :offset="[0, 8]"
      @before-show="refresh">
      <div class="app-header-notifications__header">
        <div class="app-header-notifications__title-row">
          <p class="app-header-notifications__title">
            {{ t('notificationsTitle') }}
          </p>
          <q-spinner
            v-if="loading"
            color="primary"
            size="16px"
            :data-testid="layoutTestIds.notificationsLoading"
          />
        </div>
        <q-btn
          v-if="unreadCount"
          flat
          dense
          no-caps
          class="app-header-notifications__mark-all"
          :label="t('notificationsMarkAllRead')"
          :disable="busy"
          :data-testid="layoutTestIds.notificationsMarkAll"
          @click.stop="onMarkAll"
        />
      </div>
      <q-list
        class="app-header-notifications__list"
        :data-testid="layoutTestIds.notificationsMenu">
        <q-item
          v-if="!loading && !items.length"
          class="app-header-notifications__empty">
          <q-item-section>
            <q-icon
              name="notifications_none"
              size="32px"
              class="app-header-notifications__empty-icon"
            />
            <div class="text-grey-7 q-mt-sm">
              {{ t('notificationsEmpty') }}
            </div>
          </q-item-section>
        </q-item>
        <q-item
          v-for="item in items"
          :key="item.id"
          clickable
          class="app-header-notifications__item"
          :class="{
            'app-header-notifications__item--unread': item.unread,
          }"
          :data-testid="layoutTestIds.notificationItem(item.id)"
          @click="onOpen(item)">
          <q-item-section avatar>
            <div class="app-header-notifications__icon">
              <q-icon :name="itemIcon(item)" size="20px" />
              <span
                v-if="item.unread"
                class="app-header-notifications__unread-dot"
                aria-hidden="true"
              />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label
              class="app-header-notifications__item-title">
              {{ item.title || t('notificationsFallbackTitle') }}
            </q-item-label>
            <q-item-label
              v-if="item.body"
              caption
              class="app-header-notifications__item-body">
              {{ item.body }}
            </q-item-label>
            <q-item-label
              v-if="itemTime(item)"
              caption
              class="app-header-notifications__item-time">
              {{ itemTime(item) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="app-header-notifications__actions">
              <q-btn
                v-if="item.unread"
                flat
                round
                dense
                class="app-btn-icon-action"
                icon="done"
                :size="siteBreakpoints.SM"
                :disable="busy"
                :aria-label="t('notificationsMarkRead')"
                :data-testid="
                  layoutTestIds.notificationMarkRead(item.id)
                "
                @click.stop="onMarkRead(item)">
                <q-tooltip
                  class="app-info-tooltip"
                  anchor="top middle"
                  self="bottom middle"
                  :offset="[0, 6]">
                  {{ t('notificationsMarkRead') }}
                </q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                class="app-btn-icon-action"
                icon="delete"
                :size="siteBreakpoints.SM"
                :disable="busy"
                :aria-label="t('notificationsDelete')"
                :data-testid="
                  layoutTestIds.notificationDelete(item.id)
                "
                @click.stop="onDelete(item)">
                <q-tooltip
                  class="app-info-tooltip"
                  anchor="top middle"
                  self="bottom middle"
                  :offset="[0, 6]">
                  {{ t('notificationsDelete') }}
                </q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  quasarNotifyTypes,
  siteBreakpoints,
} from 'src/components/constants.js'
import { layoutTestIds } from 'src/test-ids/index.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from 'src/utils/notification-api.js'

const POLL_MS = 60000
const RESULTS_READY_TYPE = 'ENCOUNTER_RESULTS_READY'
const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const menuRef = ref(null)
const items = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const busy = ref(false)
let timer = null

function itemIcon(item) {
  return item?.type === RESULTS_READY_TYPE
    ? 'science'
    : 'notifications'
}

function itemTime(item) {
  const date = new Date(item?.createdAt)
  if (!item?.createdAt || Number.isNaN(date.getTime())) {
    return ''
  }
  const diff = Date.now() - date.getTime()
  if (diff < MINUTE_MS) {
    return t('notificationsJustNow')
  }
  if (diff < HOUR_MS) {
    return t('notificationsMinutesAgo', {
      n: Math.max(1, Math.floor(diff / MINUTE_MS)),
    })
  }
  if (diff < DAY_MS) {
    return t('notificationsHoursAgo', {
      n: Math.max(1, Math.floor(diff / HOUR_MS)),
    })
  }
  if (diff < 7 * DAY_MS) {
    return t('notificationsDaysAgo', {
      n: Math.max(1, Math.floor(diff / DAY_MS)),
    })
  }

  return date.toLocaleDateString()
}

function notifyError(key) {
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: t(key),
  })
}

function syncUnreadCount() {
  unreadCount.value = items.value.filter(row => row.unread).length
}

function hideMenu() {
  menuRef.value?.hide?.()
}

async function refresh() {
  loading.value = true
  try {
    const rows = await listNotifications({ unreadOnly: false })
    items.value = rows.slice(0, 12)
    syncUnreadCount()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      items.value = []
      unreadCount.value = 0
    }
  } finally {
    loading.value = false
  }
}

async function onMarkRead(item) {
  if (!item?.unread || busy.value) {
    return
  }
  busy.value = true
  try {
    await markNotificationRead(item.id)
    item.unread = false
    syncUnreadCount()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError('notificationsMarkReadError')
    }
  } finally {
    busy.value = false
  }
}

async function onMarkAll() {
  if (!unreadCount.value || busy.value) {
    return
  }
  busy.value = true
  try {
    await markAllNotificationsRead()
    items.value = items.value.map(row => ({
      ...row,
      unread: false,
    }))
    unreadCount.value = 0
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError('notificationsMarkAllReadError')
    }
  } finally {
    busy.value = false
  }
}

async function onDelete(item) {
  if (!item?.id || busy.value) {
    return
  }
  busy.value = true
  try {
    await deleteNotification(item.id)
    items.value = items.value.filter(row => row.id !== item.id)
    syncUnreadCount()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError('notificationsDeleteError')
    }
  } finally {
    busy.value = false
  }
}

async function onOpen(item) {
  if (item?.unread) {
    try {
      await markNotificationRead(item.id)
      item.unread = false
      syncUnreadCount()
    } catch (error) {
      if (isAuthSessionEndUIError(error)) {
        return
      }
    }
  }
  hideMenu()
  if (item?.entityType === 'ENCOUNTER' && item.entityId != null) {
    await router.push({
      name: 'EncounterWorkspace',
      params: { id: String(item.entityId) },
    })
  }
}

onMounted(() => {
  void refresh()
  timer = window.setInterval(() => {
    void refresh()
  }, POLL_MS)
})

onUnmounted(() => {
  if (timer != null) {
    window.clearInterval(timer)
  }
})
</script>
