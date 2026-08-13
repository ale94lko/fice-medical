<template>
  <div
    class="row q-col-gutter-sm items-center
      appointment-service-lines__search-row">
    <div class="col">
      <q-select
        :model-value="modelValue"
        outlined
        hide-bottom-space
        use-input
        fill-input
        hide-selected
        input-debounce="200"
        emit-value
        map-options
        option-label="label"
        :options="options"
        :disable="disable"
        :loading="loading"
        :placeholder="placeholder"
        :data-testid="testIdPrefix + '-search'"
        @update:model-value="emit('update:modelValue', $event)"
        @filter="onFilter"
        @input-value="emit('input-value', $event)">
        <template #prepend>
          <q-icon name="search" size="18px" />
        </template>
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey-7">
              {{ emptyLabel || t('appointmentServicesSearchEmpty') }}
            </q-item-section>
          </q-item>
        </template>
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label>{{ scope.opt.name }}</q-item-label>
              <q-item-label
                v-if="scope.opt.caption || optionCaption(scope.opt)"
                caption>
                {{ scope.opt.caption || optionCaption(scope.opt) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <div class="col-auto">
      <q-btn
        no-caps
        unelevated
        color="primary"
        class="app-btn-primary appointment-service-lines__add-btn"
        icon="add"
        :label="t('appointmentServicesAddButton')"
        :disable="addDisable"
        :data-testid="testIdPrefix + '-add'"
        @click="emit('add')"
      />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: { default: null },
  options: { type: Array, default: () => [] },
  disable: { type: Boolean, default: false },
  addDisable: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  placeholder: { type: String, default: undefined },
  emptyLabel: { type: String, default: '' },
  testIdPrefix: { type: String, default: 'appointment-services' },
  formatCaption: { type: Function, default: null },
})

const emit = defineEmits([
  'update:modelValue',
  'filter',
  'input-value',
  'add',
])
const { t } = useI18n()

function onFilter(val, update) {
  emit('filter', val, update)
}

function optionCaption(option) {
  const parts = []
  if (option.cptCode) {
    parts.push(`CPT ${option.cptCode}`)
  }
  if (option.durationSummary) {
    parts.push(option.durationSummary)
  }

  return parts.join(' · ')
}
</script>
