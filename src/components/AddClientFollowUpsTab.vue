<template>
  <div v-if="section.visible" class="add-client-follow-ups-tab">
    <div class="row items-center justify-between q-mb-md">
      <h3 class="follow-ups-tab__list-title q-mb-none">
        {{ t('followUpExistingTitle') }}
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
      v-if="hasUnsavedChanges"
      class="text-body2 text-grey-7 q-mb-md">
      {{ t('followUpPendingSaveHint') }}
    </p>

    <div
      v-if="!displayFollowUps.length"
      class="fmh-list-card q-pa-xl text-center">
      <q-icon name="event_busy" size="md" color="grey-6" />
      <p class="text-body1 text-grey-8 q-mt-md q-mb-xs">
        {{ t('followUpListEmpty') }}
      </p>
      <p class="text-body2 text-grey-7 q-mb-none">
        {{ t('followUpListEmptyHint') }}
      </p>
    </div>

    <template v-else>
      <div class="follow-ups-tab__cards q-gutter-y-md">
        <article
          v-for="item in displayFollowUps"
          :key="item.id"
          class="follow-up-card fmh-list-card q-pa-md"
          :class="{ 'follow-up-card--overdue': item.overdue }">
          <div class="follow-up-card__row row no-wrap">
            <div
              class="follow-up-card__icon"
              :class="iconClass(item)">
              <q-icon
                :name="cardIconName(item)"
                size="20px"
              />
            </div>

            <div class="follow-up-card__body col">
              <div class="row items-start no-wrap">
                <div class="col">
                  <div class="follow-up-card__type">
                    {{ typeLabel(item.type) }}
                    <span
                      v-if="isUnsavedItem(item)"
                      class="follow-up-card__pending-badge">
                      {{ t('followUpPendingBadge') }}
                    </span>
                  </div>
                  <div
                    v-if="relatedDisplay(item)"
                    class="follow-up-card__related text-body2">
                    {{ relatedDisplay(item) }}
                  </div>
                  <div
                    v-if="item.notes"
                    class="follow-up-card__notes text-body2">
                    {{ item.notes }}
                  </div>
                  <div class="follow-up-card__meta row q-gutter-md">
                    <span class="follow-up-card__meta-item">
                      <q-icon name="event" size="14px" />
                      {{ t('followUpDueLabel') }}:
                      {{ item.dueDate || '—' }}
                    </span>
                    <span
                      v-if="providerLabel(item)"
                      class="follow-up-card__meta-item">
                      <q-icon name="person" size="14px" />
                      {{ providerLabel(item) }}
                    </span>
                  </div>
                  <p
                    v-if="item.overdue"
                    class="follow-up-card__overdue-hint text-body2">
                    {{ t('followUpOverdueHint') }}
                  </p>
                </div>

                <div class="follow-up-card__aside col-auto">
                  <span
                    class="follow-up-status-badge"
                    :class="statusBadgeClass(item)">
                    {{ statusLabel(item) }}
                  </span>
                  <q-btn
                    v-if="showRowMenu(item)"
                    flat
                    round
                    dense
                    icon="more_vert"
                    color="grey-8"
                    :aria-label="t('actions')"
                    :data-testid="tid.rowMenu(item.id)">
                    <q-menu anchor="bottom right" self="top right">
                      <q-list dense style="min-width: 160px">
                        <q-item
                          v-if="canEditRow(item)"
                          v-close-popup
                          clickable
                          :data-testid="tid.rowEdit(item.id)"
                          @click="openEdit(item)">
                          <q-item-section>
                            {{ t('edit') }}
                          </q-item-section>
                        </q-item>
                        <q-item
                          v-if="canCompleteRow(item)"
                          v-close-popup
                          clickable
                          :data-testid="tid.rowComplete(item.id)"
                          @click="confirmComplete(item)">
                          <q-item-section>
                            {{ t('followUpActionComplete') }}
                          </q-item-section>
                        </q-item>
                        <q-item
                          v-if="canCancelRow(item)"
                          v-close-popup
                          clickable
                          :data-testid="tid.rowCancel(item.id)"
                          @click="confirmCancel(item)">
                          <q-item-section>
                            {{ t('followUpActionCancel') }}
                          </q-item-section>
                        </q-item>
                        <q-item
                          v-if="canViewRow(item)"
                          v-close-popup
                          clickable
                          :data-testid="tid.rowView(item.id)"
                          @click="openView(item)">
                          <q-item-section>
                            {{ t('followUpActionView') }}
                          </q-item-section>
                        </q-item>
                        <q-item
                          v-if="canRemovePending(item)"
                          v-close-popup
                          clickable
                          @click="removePending(item)">
                          <q-item-section>
                            {{ t('followUpActionRemovePending') }}
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <p class="follow-ups-tab__count text-body2 text-grey-7">
        {{ t('followUpCount', { count: displayFollowUps.length }) }}
      </p>
    </template>

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
  </div>
</template>

<script setup>
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import FollowUpEditDialog from 'components/FollowUpEditDialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { followUpStatuses, quasarNotifyTypes } from 'components/constants.js'
import { useClientFollowUpPermissions } from
  'src/composables/useClientFollowUpPermissions.js'
import { useFollowUpReferenceSources } from
  'src/composables/useFollowUpReferenceSources.js'
import {
  applyLocalFollowUpCancel,
  applyLocalFollowUpComplete,
  followUpsSectionHasUnsavedChanges,
  mapEntryFromDraft,
  mapPendingFollowUpFromDraft,
} from 'src/utils/client-follow-ups.js'
import {
  buildFollowUpTypeOptions,
  followUpCanEditRecord,
  followUpCanViewRecord,
  followUpStatusLabel,
  providerLabelForFollowUp,
  resolveFollowUpDisplayStatus,
} from 'src/utils/follow-up-utils.js'
import { followUpTestIds as tid } from 'src/test-ids/index.js'

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

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()
const {
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

const typeOptions = computed(() => buildFollowUpTypeOptions(t))

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

function isUnsavedItem(item) {
  return item.isPending || item.isDirty || Boolean(item.pendingAction)
}

function typeLabel(type) {
  const match = typeOptions.value.find(
    opt => String(opt.value) === String(type),
  )

  return match?.label ?? type ?? '—'
}

function providerLabel(item) {
  return providerLabelForFollowUp(item, props.clinicianOptions)
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

function statusLabel(item) {
  return followUpStatusLabel(t, resolveFollowUpDisplayStatus(item))
}

function statusBadgeClass(item) {
  const status = resolveFollowUpDisplayStatus(item)

  return `follow-up-status-badge--${status.toLowerCase()}`
}

function iconClass(item) {
  const status = resolveFollowUpDisplayStatus(item)

  return `follow-up-card__icon--${status.toLowerCase()}`
}

function cardIconName(item) {
  const status = resolveFollowUpDisplayStatus(item)
  if (status === followUpStatuses.completed) {
    return 'check'
  }
  if (status === followUpStatuses.overdue) {
    return 'error_outline'
  }
  if (status === followUpStatuses.cancelled) {
    return 'block'
  }

  return 'event'
}

function canEditRow(item) {
  if (item.isPending) {
    return canAddFollowUps.value
  }

  return canEditFollowUps.value && followUpCanEditRecord(item)
}

function canCompleteRow(item) {
  return canEditFollowUps.value
    && followUpCanEditRecord(item)
    && !item.isPending
}

function canCancelRow(item) {
  return canCompleteRow(item)
}

function canViewRow(item) {
  return followUpCanViewRecord(item) && !item.isPending
}

function canRemovePending(item) {
  return item.isPending && canAddFollowUps.value
}

function showRowMenu(item) {
  return canEditRow(item)
    || canCompleteRow(item)
    || canCancelRow(item)
    || canViewRow(item)
    || canRemovePending(item)
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
    type: quasarNotifyTypes.info,
    message: t('followUpPendingAdded'),
  })
}

function onSaveEdit(payload) {
  if (!activeRecord.value?.id) {
    return
  }
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
    type: quasarNotifyTypes.info,
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
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;

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

.follow-up-card {
  &--overdue {
    border-color: rgba(#dc2626, 0.35);
  }

  &__row {
    gap: 12px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;

    &--scheduled {
      background: #fef9c3;
      color: #ca8a04;
    }

    &--completed {
      background: #dcfce7;
      color: #16a34a;
    }

    &--overdue {
      background: #fee2e2;
      color: #dc2626;
    }

    &--cancelled {
      background: #f3f4f6;
      color: #6b7280;
    }
  }

  &__type {
    font-weight: 600;
    color: $text-strong;
    margin-bottom: 4px;
  }

  &__pending-badge {
    margin-left: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    color: $primary;
  }

  &__related {
    color: $grey-8;
    margin-bottom: 4px;
  }

  &__notes {
    color: $grey-7;
    margin-bottom: 8px;
  }

  &__overdue-hint {
    color: #b91c1c;
    margin: 6px 0 0;
  }

  &__meta {
    margin-top: 4px;
  }

  &__meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8125rem;
    color: $grey-7;
  }

  &__aside {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    margin-left: 12px;
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
}
</style>
