<template>
  <div class="admin-table-row-actions">
    <q-btn
      v-if="showView"
      flat
      round
      dense
      :icon="adminTableActionIcons.view"
      class="app-btn-icon-action"
      :data-testid="viewTestId"
      :size="siteBreakpoints.SM"
      :title="t('view')"
      :aria-label="t('view')"
      @click="emit('view')"
    />
    <q-btn
      v-if="showEdit"
      flat
      round
      dense
      :icon="adminTableActionIcons.edit"
      class="app-btn-icon-action"
      :data-testid="editTestId"
      :size="siteBreakpoints.SM"
      :title="t('edit')"
      :aria-label="t('edit')"
      @click="emit('edit')"
    />
    <q-btn
      v-if="showChangeStatus"
      flat
      round
      dense
      :icon="adminTableActionIcons.changeStatus"
      class="app-btn-icon-action"
      :data-testid="changeStatusTestId"
      :size="siteBreakpoints.SM"
      :title="t('changeStatus')"
      :aria-label="t('changeStatus')"
      @click="emit('change-status')"
    />
    <q-btn
      v-if="showMore"
      flat
      round
      dense
      :icon="adminTableActionIcons.more"
      class="app-btn-icon-action"
      :data-testid="moreTestId"
      :size="siteBreakpoints.SM"
      :title="t('moreActions')"
      :aria-label="t('moreActions')">
      <q-menu anchor="bottom right" self="top right">
        <q-list dense>
          <slot name="more" />
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'

defineProps({
  showView: {
    type: Boolean,
    default: true,
  },
  showEdit: {
    type: Boolean,
    default: true,
  },
  showChangeStatus: {
    type: Boolean,
    default: false,
  },
  showMore: {
    type: Boolean,
    default: true,
  },
  viewTestId: {
    type: String,
    default: '',
  },
  editTestId: {
    type: String,
    default: '',
  },
  changeStatusTestId: {
    type: String,
    default: '',
  },
  moreTestId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['view', 'edit', 'change-status'])

const { t } = useI18n()
</script>
