<template>
  <div
    v-if="visibleActions.length"
    class="admin-list-page__actions">
    <div
      v-if="!useCompactMenu"
      class="admin-list-page__actions-bar row items-center
        q-gutter-sm no-wrap">
      <q-btn
        v-for="action in visibleActions"
        :key="action.key"
        no-caps
        no-wrap
        color="primary"
        :unelevated="isPrimary(action)"
        :outline="!isPrimary(action)"
        :class="actionButtonClass(action)"
        :icon="action.icon"
        :disable="Boolean(action.disable)"
        :data-testid="action.testId"
        :label="action.label"
        @click="runAction(action)"
      />
    </div>

    <q-btn
      v-else
      unelevated
      outline
      no-caps
      color="primary"
      :icon="adminTableActionIcons.more"
      class="app-btn-outline admin-list-page__actions-menu-btn"
      :data-testid="menuTestId"
      :aria-label="t('moreActions')"
      >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('moreActions') }}
          </q-tooltip>
      <q-menu
        anchor="bottom right"
        self="top right"
        :offset="[0, 8]"
        class="app-light-menu admin-list-page__actions-menu">
        <q-list dense>
          <q-item
            v-for="action in visibleActions"
            :key="action.key"
            v-close-popup
            clickable
            :disable="Boolean(action.disable)"
            :data-testid="action.testId"
            @click="runAction(action)">
            <q-item-section
              v-if="action.icon"
              avatar>
              <q-icon
                :name="action.icon"
                color="primary"
                size="18px"
              />
            </q-item-section>
            <q-item-section>{{ action.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { adminTableTestIds } from 'src/test-ids/index.js'
import { useViewportLayout } from 'src/composables/useViewportLayout.js'

const props = defineProps({
  actions: {
    type: Array,
    default: () => [],
  },
  menuTestId: {
    type: String,
    default: adminTableTestIds.pageActionsMenu,
  },
  /**
   * null — compact on mobile/tablet (default)
   * true — always ⋮ menu
   * false — always inline action buttons
   */
  compact: {
    default: null,
    validator: value => value === null || typeof value === 'boolean',
  },
})

const { t } = useI18n()
const { isDesktop } = useViewportLayout()

const useCompactMenu = computed(() => {
  if (props.compact === true) {
    return true
  }
  if (props.compact === false) {
    return false
  }

  return !isDesktop.value
})

const visibleActions = computed(() =>
  (Array.isArray(props.actions) ? props.actions : []).filter(
    action => action && action.visible !== false,
  ),
)

function isPrimary(action) {
  return action.variant === 'primary'
}

function actionButtonClass(action) {
  const classes = [
    isPrimary(action) ? 'app-btn-primary' : 'app-btn-outline',
  ]
  if (action.className) {
    classes.push(action.className)
  }

  return classes
}

function runAction(action) {
  if (action.disable || typeof action.onClick !== 'function') {
    return
  }
  action.onClick()
}
</script>
