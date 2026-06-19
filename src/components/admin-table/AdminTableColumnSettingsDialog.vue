<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="app-dialog-card app-dialog-card--sm">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ t('adminTableColumnSettingsTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ t('adminTableColumnSettingsHint') }}
        </p>

        <div class="admin-table-column-settings">
          <div
            v-for="(columnId, index) in draftOrder"
            :key="columnId"
            class="admin-table-column-settings__row row items-center">
            <FormToggle
              :model-value="!draftHidden.includes(columnId)"
              :disable="isRequired(columnId)"
              :label="columnLabel(columnId)"
              @update:model-value="value => onToggle(columnId, value)"
            />
            <div class="admin-table-column-settings__move row q-ml-auto">
              <q-btn
                flat
                round
                dense
                icon="arrow_upward"
                color="primary"
                :disable="index === 0 || isLocked(columnId)"
                :aria-label="t('moveUp')"
                @click="moveColumn(columnId, -1)"
              />
              <q-btn
                flat
                round
                dense
                icon="arrow_downward"
                color="primary"
                :disable="index === draftOrder.length - 1
                  || isLocked(columnId)"
                :aria-label="t('moveDown')"
                @click="moveColumn(columnId, 1)"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('reset')"
          @click="onReset"
        />
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('save')"
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
import FormToggle from 'components/FormToggle.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  preferences: {
    type: Object,
    required: true,
  },
  columnLabels: {
    type: Object,
    default: () => ({}),
  },
  defaultOrder: {
    type: Array,
    required: true,
  },
  isRequiredColumn: {
    type: Function,
    default: () => false,
  },
  isLockedColumn: {
    type: Function,
    default: () => false,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'reset'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const draftOrder = ref([])
const draftHidden = ref([])

watch(
  () => [props.modelValue, props.preferences],
  ([visible]) => {
    if (!visible) {
      return
    }
    draftOrder.value = [...(props.preferences.order ?? props.defaultOrder)]
    draftHidden.value = [...(props.preferences.hidden ?? [])]
  },
  { immediate: true, deep: true },
)

function columnLabel(columnId) {
  return props.columnLabels[columnId] ?? columnId
}

function isRequired(columnId) {
  return props.isRequiredColumn(columnId)
}

function isLocked(columnId) {
  return props.isLockedColumn(columnId)
}

function onToggle(columnId, visible) {
  if (isRequired(columnId)) {
    return
  }
  if (visible) {
    draftHidden.value = draftHidden.value.filter(name => name !== columnId)
    return
  }
  if (!draftHidden.value.includes(columnId)) {
    draftHidden.value = [...draftHidden.value, columnId]
  }
}

function moveColumn(columnId, direction) {
  if (isLocked(columnId)) {
    return
  }
  const index = draftOrder.value.indexOf(columnId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= draftOrder.value.length) {
    return
  }
  const next = [...draftOrder.value]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  draftOrder.value = next
}

function onCancel() {
  open.value = false
}

function onReset() {
  emit('reset')
  open.value = false
}

function onSave() {
  emit('save', {
    order: [...draftOrder.value],
    hidden: [...draftHidden.value],
  })
  open.value = false
}
</script>
