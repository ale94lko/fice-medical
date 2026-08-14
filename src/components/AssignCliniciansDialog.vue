<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="assignCliniciansTestIds.dialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog app-dialog-card
        assign-clinicians-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        :info="t('assignCliniciansSubtitle')"
        @close="onCancel">
        {{ t('assignCliniciansTitle') }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md
          assign-clinicians-dialog__body">
        <div class="assign-clinicians-dialog__panes">
          <section class="assign-clinicians-dialog__pane">
            <h3 class="assign-clinicians-dialog__pane-title">
              {{ t('assignCliniciansAvailable') }}
            </h3>
            <TextInput
              v-model="search"
              outlined
              dense
              hide-bottom-space
              icon-left="search"
              class="assign-clinicians-dialog__search"
              :placeholder="t('assignCliniciansSearchPlaceholder')"
              :test-id="assignCliniciansTestIds.search"
            />
            <div class="assign-clinicians-dialog__list">
              <div
                v-if="noCatalog"
                class="assign-clinicians-dialog__empty">
                <strong>
                  {{ t('assignCliniciansEmptyAvailable') }}
                </strong>
                <span>
                  {{ t('assignCliniciansEmptyAvailableHint') }}
                </span>
              </div>
              <div
                v-else-if="noSearchResults"
                class="assign-clinicians-dialog__empty">
                <strong>
                  {{ t('assignCliniciansEmptySearch') }}
                </strong>
                <span>
                  {{ t('assignCliniciansEmptySearchHint') }}
                </span>
              </div>
              <div
                v-for="item in pagedAvailable"
                :key="item.id"
                role="button"
                tabindex="0"
                class="assign-clinicians-dialog__row"
                :class="{
                  'assign-clinicians-dialog__row--selected':
                    selectedAvailable.includes(item.id),
                }"
                :data-testid="
                  assignCliniciansTestIds.availableItem(item.id)
                "
                @click="toggleAvailable(item.id)"
                @keydown.enter.prevent="toggleAvailable(item.id)"
                @keydown.space.prevent="toggleAvailable(item.id)">
                <div
                  class="assign-clinicians-dialog__check"
                  @click.stop="toggleAvailable(item.id)">
                  <q-checkbox
                    dense
                    color="primary"
                    :model-value="
                      selectedAvailable.includes(item.id)
                    "
                  />
                </div>
                <AssignClinicianAvatar :item="item" />
                <div class="assign-clinicians-dialog__row-text">
                  <div class="assign-clinicians-dialog__name">
                    {{ clinicianCardTitle(item) }}
                  </div>
                  <div class="assign-clinicians-dialog__meta">
                    {{ clinicianMetaLine(item, t) }}
                  </div>
                </div>
                <span
                  v-if="item.specialty"
                  class="assign-clinicians-dialog__badge"
                  :class="`assign-clinicians-dialog__badge--${
                    taxonomySpecialtyTone(item.specialty)
                  }`">
                  {{ item.specialty }}
                </span>
              </div>
            </div>
            <div
              v-if="filteredAvailable.length"
              class="assign-clinicians-dialog__pager">
              <span>
                {{ t('assignCliniciansShowing', {
                  from: pageFrom,
                  to: pageTo,
                  total: filteredAvailable.length,
                }) }}
              </span>
              <q-pagination
                v-model="page"
                :max="pagesNumber"
                :max-pages="5"
                direction-links
                color="primary"
                size="sm"
              />
            </div>
          </section>

          <div class="assign-clinicians-dialog__transfer">
            <q-btn
              unelevated
              color="primary"
              icon="chevron_right"
              class="assign-clinicians-dialog__transfer-btn"
              :disable="!selectedAvailable.length || saving"
              :data-testid="assignCliniciansTestIds.assign"
              :aria-label="t('assignCliniciansAssign')"
              @click="assignSelected"
            />
            <q-btn
              outline
              color="primary"
              icon="chevron_left"
              class="assign-clinicians-dialog__transfer-btn"
              :disable="!selectedAssigned.length || saving"
              :data-testid="assignCliniciansTestIds.unassign"
              :aria-label="t('assignCliniciansUnassign')"
              @click="unassignSelected"
            />
          </div>

          <section class="assign-clinicians-dialog__pane">
            <div class="assign-clinicians-dialog__pane-head">
              <h3 class="assign-clinicians-dialog__pane-title">
                {{ t('assignedClinicians') }}
                ({{ assigned.length }})
              </h3>
              <q-btn
                v-if="assigned.length"
                flat
                dense
                no-caps
                color="primary"
                icon="delete"
                class="assign-clinicians-dialog__clear"
                :label="t('assignCliniciansClearAll')"
                :disable="saving"
                :data-testid="assignCliniciansTestIds.clearAll"
                @click="clearAssigned"
              />
            </div>
            <div class="assign-clinicians-dialog__list">
              <div
                v-if="!assigned.length"
                class="assign-clinicians-dialog__empty">
                <span>{{ t('assignedCliniciansEmpty') }}</span>
              </div>
              <div
                v-for="item in assigned"
                :key="item.id"
                class="assign-clinicians-dialog__row
                  assign-clinicians-dialog__row--assigned"
                :class="{
                  'assign-clinicians-dialog__row--selected':
                    selectedAssigned.includes(item.id),
                }"
                :data-testid="
                  assignCliniciansTestIds.assignedItem(item.id)
                ">
                <button
                  type="button"
                  class="assign-clinicians-dialog__row-main"
                  @click="toggleAssigned(item.id)">
                  <AssignClinicianAvatar :item="item" />
                  <div class="assign-clinicians-dialog__row-text">
                    <div class="assign-clinicians-dialog__name">
                      {{ clinicianCardTitle(item) }}
                    </div>
                    <div class="assign-clinicians-dialog__meta">
                      {{ clinicianMetaLine(item, t) }}
                    </div>
                  </div>
                  <span
                    v-if="item.specialty"
                    class="assign-clinicians-dialog__badge"
                    :class="`assign-clinicians-dialog__badge--${
                      taxonomySpecialtyTone(item.specialty)
                    }`">
                    {{ item.specialty }}
                  </span>
                </button>
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  class="app-btn-icon-action"
                  :aria-label="t('delete')"
                  :data-testid="
                    assignCliniciansTestIds.remove(item.id)
                  "
                  @click="removeAssigned(item.id)"
                />
              </div>
            </div>
            <div class="assign-clinicians-dialog__hint">
              <q-icon name="info" size="18px" />
              <span>{{ t('assignCliniciansHint') }}</span>
            </div>
          </section>
        </div>

        <q-inner-loading :showing="loading || saving" />
      </q-card-section>

      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          unelevated
          class="app-btn-outline"
          :label="t('cancel')"
          :disable="saving"
          :data-testid="assignCliniciansTestIds.cancel"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('assignCliniciansSave')"
          :loading="saving"
          :disable="!hasChanges || loading"
          :data-testid="assignCliniciansTestIds.save"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import TextInput from 'components/TextInput.vue'
import AssignClinicianAvatar from
  'components/AssignClinicianAvatar.vue'
import { quasarNotifyTypes } from 'src/components/constants.js'
import { useAssignClientClinicians } from
  'src/composables/useAssignClientClinicians.js'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import { clientClinicianApiErrorMessage } from
  'src/utils/client-clinician-api.js'
import {
  clinicianCardTitle,
  clinicianMetaLine,
} from 'src/utils/client-clinician-normalize.js'
import { taxonomySpecialtyTone } from
  'src/utils/staff-taxonomy-display.js'
import { assignCliniciansTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])
const { t } = useI18n()
const $q = useQuasar()
const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
const clientId = toRef(props, 'clientId')

function onError(error, fallbackKey) {
  if (isAuthSessionEndUIError(error)) {
    return
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: clientClinicianApiErrorMessage(error, t(fallbackKey)),
  })
}

const {
  loading,
  saving,
  assigned,
  selectedAvailable,
  selectedAssigned,
  search,
  page,
  filteredAvailable,
  pagedAvailable,
  pagesNumber,
  hasChanges,
  noCatalog,
  noSearchResults,
  pageFrom,
  pageTo,
  toggleAvailable,
  toggleAssigned,
  assignSelected,
  unassignSelected,
  removeAssigned,
  clearAssigned,
  save,
} = useAssignClientClinicians({
  clientId,
  open,
  onError,
})

function onCancel() {
  open.value = false
}

async function onSave() {
  const ok = await save()
  if (ok) {
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('assignCliniciansSaved'),
    })
    emit('saved')
    open.value = false
  }
}
</script>
