<template>
  <div v-if="section.visible" class="add-client-follow-ups-tab">
    <div
      v-if="!canViewFollowUps"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('followUpNoPermission') }}
      </p>
    </div>

    <template v-else>
    <div class="row items-center justify-between q-mb-md">
      <h3 class="follow-ups-tab__list-title row items-center no-wrap q-mb-none">
        <q-icon
          name="update"
          size="24px"
          color="primary"
          class="q-mr-sm"
        />
        <span>{{ t('followUpExistingTitle') }}</span>
      </h3>
      <q-btn
        v-if="canAddFollowUps"
        no-caps
        unelevated
        color="primary"
        class="app-btn-primary"
        icon="add"
        :label="t('followUpAddButton')"
        :data-testid="tid.btn('add')"
        @click="openAdd"
      />
    </div>

    <p
      v-if="hasUnsavedChanges && !isMobile"
      class="text-body2 text-grey-7 q-mb-md">
      {{ t('followUpPendingSaveHint') }}
    </p>

    <AdminTablePanel
      class="follow-ups-table-panel admin-table-panel--wide"
      :show-column-settings="false">
      <FollowUpsTable
        :entries="displayFollowUps"
        :empty-label="t('followUpListEmpty')"
        :clinician-options="clinicianOptions"
        :related-label-fn="relatedDisplay"
        :can-add="canAddFollowUps"
        :can-edit="canEditFollowUps"
        @edit="openEdit"
        @view="openView"
        @complete="confirmComplete"
        @cancel="confirmCancel"
        @remove-pending="removePending"
      />
    </AdminTablePanel>

    <p
      v-if="displayFollowUps.length"
      class="follow-ups-tab__count text-body2 text-grey-7">
      {{ t('followUpCount', { count: displayFollowUps.length }) }}
    </p>

    <FollowUpEditDialog
      v-model="formDialogOpen"
      :record="activeRecord"
      :mode="dialogMode"
      :clinician-options="clinicianOptions"
      :client-id="clientId"
      :reference-context="referenceContext"
      @save="onFormSave"
    />

    <ModalComponent
      v-model="completeDialogOpen"
      :title="t('followUpCompleteConfirmTitle')"
      :message="t('followUpCompleteConfirmMessage')"
      :confirm-text="t('followUpActionComplete')"
      :cancel-text="t('cancel')"
      test-id="follow-up-complete"
      @confirm="onCompleteConfirmed"
    />

    <ModalComponent
      v-model="cancelDialogOpen"
      :title="t('followUpCancelConfirmTitle')"
      :message="t('followUpCancelConfirmMessage')"
      :confirm-text="t('followUpActionCancel')"
      :cancel-text="t('cancel')"
      test-id="follow-up-cancel"
      @confirm="onCancelConfirmed"
    />
    </template>
  </div>
</template>

<script setup>
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import FollowUpEditDialog from 'components/FollowUpEditDialog.vue'
import FollowUpsTable from 'components/FollowUpsTable.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useClientFollowUpPermissions } from
  'src/composables/useClientFollowUpPermissions.js'
import { useFollowUpReferenceSources } from
  'src/composables/useFollowUpReferenceSources.js'
import { useViewportLayout } from
  'src/composables/useViewportLayout.js'
import {
  applyLocalFollowUpCancel,
  applyLocalFollowUpComplete,
  followUpsSectionHasUnsavedChanges,
  mapEntryFromDraft,
  mapPendingFollowUpFromDraft,
} from 'src/utils/client-follow-ups.js'
import { followUpTestIds as tid } from 'src/test-ids/index.js'
import { isReferralLinkedFollowUp } from
  'src/utils/referral-follow-up.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
  referenceContext: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'update:modelValue',
  'reassign-referral-clinician',
])

const { t } = useI18n()
const { isMobile } = useViewportLayout()
const $q = useQuasar()
const {
  canViewFollowUps,
  canAddFollowUps,
  canEditFollowUps,
} = useClientFollowUpPermissions()

const { resolveRelatedDisplay } = useFollowUpReferenceSources(
  toRef(props, 'clientId'),
  toRef(props, 'referenceContext'),
)

const formDialogOpen = ref(false)
const completeDialogOpen = ref(false)
const cancelDialogOpen = ref(false)
const activeRecord = ref(null)
const dialogMode = ref('add')
const pendingActionRecord = ref(null)

const section = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const hasUnsavedChanges = computed(() =>
  followUpsSectionHasUnsavedChanges(section.value),
)

const displayFollowUps = computed(() => [
  ...(section.value.entries ?? []),
  ...(section.value.pending ?? []),
])

function patchSection(nextSection) {
  section.value = {
    ...section.value,
    ...nextSection,
  }
}

function relatedDisplay(item) {
  if (!item?.relatedTo) {
    return ''
  }

  return resolveRelatedDisplay(
    item.relatedTo,
    item.reference,
    item.referenceLabel ?? '',
  )
}

function openAdd() {
  activeRecord.value = null
  dialogMode.value = 'add'
  formDialogOpen.value = true
}

function openEdit(item) {
  activeRecord.value = item
  dialogMode.value = 'edit'
  formDialogOpen.value = true
}

function openView(item) {
  activeRecord.value = item
  dialogMode.value = 'view'
  formDialogOpen.value = true
}

function emitReferralClinicianIfChanged(previous, payload) {
  const linked = isReferralLinkedFollowUp(payload)
    || isReferralLinkedFollowUp(previous)
  if (!linked) {
    return
  }
  const nextId = Number(payload?.assignedProviderId)
  const prevId = Number(previous?.assignedProviderId)
  if (!Number.isFinite(nextId) || nextId <= 0 || nextId === prevId) {
    return
  }
  emit('reassign-referral-clinician', {
    referralId: payload?.reference ?? previous?.reference,
    clinicianId: nextId,
  })
}

function onFormSave(payload) {
  if (dialogMode.value === 'add') {
    onCreateFollowUp(payload)

    return
  }
  onSaveEdit(payload)
}

function onCreateFollowUp(payload) {
  const pendingItem = mapPendingFollowUpFromDraft(payload)
  patchSection({
    pending: [...(section.value.pending ?? []), pendingItem],
  })
  formDialogOpen.value = false
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('followUpPendingAdded'),
  })
}

function onSaveEdit(payload) {
  if (!activeRecord.value?.id) {
    return
  }
  emitReferralClinicianIfChanged(activeRecord.value, payload)
  if (activeRecord.value.isPending) {
    const pending = (section.value.pending ?? []).map(item =>
      item.id === activeRecord.value.id
        ? {
          ...mapPendingFollowUpFromDraft(payload),
          id: item.id,
          isPending: true,
        }
        : item,
    )
    patchSection({ pending })
    formDialogOpen.value = false

    return
  }
  const entries = (section.value.entries ?? []).map(item =>
    item.id === activeRecord.value.id
      ? mapEntryFromDraft(item, payload)
      : item,
  )
  patchSection({ entries })
  formDialogOpen.value = false
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('followUpPendingAdded'),
  })
}

function removePending(item) {
  patchSection({
    pending: (section.value.pending ?? []).filter(
      row => row.id !== item.id,
    ),
  })
}

function confirmComplete(item) {
  pendingActionRecord.value = item
  completeDialogOpen.value = true
}

function confirmCancel(item) {
  pendingActionRecord.value = item
  cancelDialogOpen.value = true
}

function onCompleteConfirmed() {
  completeDialogOpen.value = false
  const record = pendingActionRecord.value
  pendingActionRecord.value = null
  if (!record?.id || record.isPending) {
    return
  }
  patchSection({
    entries: (section.value.entries ?? []).map(item =>
      item.id === record.id
        ? applyLocalFollowUpComplete(item)
        : item,
    ),
  })
}

function onCancelConfirmed() {
  cancelDialogOpen.value = false
  const record = pendingActionRecord.value
  pendingActionRecord.value = null
  if (!record?.id || record.isPending) {
    return
  }
  patchSection({
    entries: (section.value.entries ?? []).map(item =>
      item.id === record.id
        ? applyLocalFollowUpCancel(item, record.notes)
        : item,
    ),
  })
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.add-client-follow-ups-tab {
  width: 100%;

  .follow-ups-tab__list-title {
    font-size: 1rem;
    font-weight: 600;
    color: $primary;
  }

  .follow-ups-tab__count {
    margin: 16px 0 0;
    text-align: center;
  }
}
</style>

<style lang="scss">
.follow-up-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;

  &--scheduled {
    background: #fef9c3;
    color: #a16207;
  }

  &--pending {
    background: #e0f2fe;
    color: #0369a1;
  }

  &--completed {
    background: #dcfce7;
    color: #15803d;
  }

  &--overdue {
    background: #fee2e2;
    color: #b91c1c;
  }

  &--cancelled {
    background: #f3f4f6;
    color: #4b5563;
  }

  &--unsaved {
    background: #e0f2f1;
    color: #0f766e;
  }
}

.admin-table-grid-item.follow-ups-table__card--overdue
.admin-table-grid-card {
  border-color: rgba(#dc2626, 0.35);
}
</style>
