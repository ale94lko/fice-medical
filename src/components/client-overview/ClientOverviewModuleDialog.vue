<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="emit('update:modelValue', $event)">
    <q-card
      class="app-dialog-card client-overview-module-dialog"
      :class="dialogCardClass"
      :style="dialogCardStyle"
      :data-testid="clientOverviewTestIds.moduleDialog">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onClose">
        <div
          v-if="isAllergiesModule"
          class="client-overview-module-dialog__title-wrap">
          <div
            class="client-overview-module-dialog__title-icon"
            :class="titleIconToneClass">
            <q-icon :name="moduleIcon" size="20px" />
          </div>
          <div class="client-overview-module-dialog__title-copy">
            <span class="client-overview-module-dialog__title-text">
              {{ dialogTitle }}
            </span>
            <span
              v-if="summaryLabel"
              class="client-overview-module-dialog__title-sub">
              {{ summaryLabel }}
            </span>
          </div>
        </div>
        <template v-else>
          {{ dialogTitle }}
        </template>
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md
          client-overview-module-dialog__body">
        <p
          v-if="summaryLabel && !isAllergiesModule"
          class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ summaryLabel }}
        </p>

        <div
          v-if="hasAllergyListContent"
          class="client-overview-module-dialog__allergy-list-wrap">
          <ClientOverviewAllergiesDialogList
            :items="tableRows"
          />
        </div>

        <div
          v-else-if="hasTableContent"
          class="add-client-form__fmh-list-card">
          <div class="add-client-form__fmh-table-wrap">
            <table class="add-client-form__fmh-table">
              <thead>
                <tr>
                  <th
                    v-for="column in tableColumns"
                    :key="column.key"
                    :class="tableHeaderClass(column)">
                    {{ t(column.labelKey) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rowIndex) in tableRows"
                  :key="`dialog-row-${rowIndex}`">
                  <td
                    v-for="column in tableColumns"
                    :key="`${rowIndex}-${column.key}`"
                    :class="tableCellClass(column)">
                    <span
                      v-if="column.cellType === 'severity'
                        && row.severityModifier"
                      :class="[
                        'allergy-severity-badge',
                        allergySeverityBadgeClass(row.severityModifier),
                      ]">
                      {{ row[column.key] }}
                    </span>
                    <template v-else>
                      {{ row[column.key] || '—' }}
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          v-else-if="hasRecordContent"
          class="client-overview-module-dialog__records">
          <article
            v-for="(record, recordIndex) in recordItems"
            :key="`dialog-record-${recordIndex}`"
            class="client-overview-module-dialog__record">
            <h4
              v-if="record.title"
              class="client-overview-module-dialog__record-title">
              {{ record.title }}
            </h4>

            <DialogFieldGrid
              v-if="record.fields?.length"
              :fields="record.fields"
            />

            <div
              v-if="record.sections?.length"
              class="client-overview-module-dialog__sections">
              <div
                v-for="(section, sectionIndex) in record.sections"
                :key="`dialog-section-${recordIndex}-${sectionIndex}`"
                class="client-overview-module-dialog__section">
                <h5
                  v-if="sectionTitle(section)"
                  class="client-overview-module-dialog__section-title">
                  {{ sectionTitle(section) }}
                </h5>

                <DialogFieldGrid
                  v-if="section.fields?.length"
                  :fields="section.fields"
                />

                <DialogSectionTable
                  v-if="section.rows?.length && section.columns?.length"
                  :columns="section.columns"
                  :rows="section.rows"
                />

                <div
                  v-if="section.sections?.length"
                  class="client-overview-module-dialog__subsections">
                  <div
                    v-for="(subsection, subIndex) in section.sections"
                    :key="`dialog-subsection-${recordIndex}-` +
                      `${sectionIndex}-${subIndex}`"
                    class="client-overview-module-dialog__section">
                    <h5
                      v-if="sectionTitle(subsection)"
                      class="client-overview-module-dialog__section-title">
                      {{ sectionTitle(subsection) }}
                    </h5>

                    <DialogSectionTable
                      v-if="subsection.rows?.length
                        && subsection.columns?.length"
                      :columns="subsection.columns"
                      :rows="subsection.rows"
                    />
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <p
          v-else
          class="client-overview-module-dialog__empty text-body2 text-grey-7">
          {{ emptyLabel }}
        </p>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          unelevated
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('close')"
          @click="onClose"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('clientOverviewModuleDialogOpenRecord')"
          @click="emit('open-record')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { addClientTabKeys } from 'components/constants.js'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import DialogFieldGrid from
  'components/client-overview/ClientOverviewModuleDialogFieldGrid.vue'
import DialogSectionTable from
  'components/client-overview/ClientOverviewModuleDialogSectionTable.vue'
import ClientOverviewAllergiesDialogList from
  'components/client-overview/ClientOverviewAllergiesDialogList.vue'
import {
  clientListAllergySeverityBadgeClass as allergySeverityBadgeClass,
} from 'src/utils/client-list-allergy-severity.js'
import { clientOverviewTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  module: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'open-record',
])

const { t } = useI18n()

const dialogTitle = computed(() => {
  const labelKey = props.module?.labelKey
  if (!labelKey) {
    return ''
  }

  return t(labelKey)
})

const summaryLabel = computed(
  () => props.module?.summary?.summaryLabel ?? '',
)

const dialogDetail = computed(
  () => props.module?.summary?.dialogDetail ?? null,
)

const tableColumns = computed(() => dialogDetail.value?.columns ?? [])
const tableRows = computed(() => dialogDetail.value?.rows ?? [])
const recordItems = computed(() => dialogDetail.value?.records ?? [])

const hasTableContent = computed(
  () => dialogDetail.value?.layout === 'table'
    && tableRows.value.length > 0,
)

const isAllergiesModule = computed(
  () => props.module?.tabKey === addClientTabKeys.allergies,
)

const dialogCardClass = computed(() => {
  if (isAllergiesModule.value) {
    return [
      'client-overview-module-dialog--allergies',
      'client-overview-allergies-dialog',
    ].join(' ')
  }

  return 'insurance-dialog'
})

const ALLERGY_DIALOG_MAX_WIDTH = '600px'

const dialogCardStyle = computed(() => {
  if (!isAllergiesModule.value) {
    return undefined
  }

  return {
    width: '100%',
    maxWidth: ALLERGY_DIALOG_MAX_WIDTH,
  }
})

const isAllergyListLayout = computed(
  () => dialogDetail.value?.layout === 'allergy-list',
)

const hasAllergyListContent = computed(
  () => isAllergyListLayout.value && tableRows.value.length > 0,
)

const moduleIcon = computed(() => props.module?.icon ?? 'medication')

const titleIconToneClass = computed(() => {
  const tone = String(props.module?.tone ?? 'red').trim()

  return `client-overview-module-dialog__title-icon--${tone}`
})

const hasRecordContent = computed(
  () => dialogDetail.value?.layout === 'records'
    && recordItems.value.length > 0,
)

const emptyLabel = computed(
  () => summaryLabel.value || t('clientOverviewModuleEmpty'),
)

function sectionTitle(section) {
  if (section?.title) {
    return section.title
  }
  if (section?.titleKey) {
    return t(section.titleKey)
  }

  return ''
}

function tableHeaderClass(column) {
  if (column.cellType === 'severity') {
    return [
      'add-client-form__fmh-table-actions-col',
      'client-overview-module-dialog__severity-col',
    ].join(' ')
  }

  return ''
}

function tableCellClass(column) {
  if (column.cellType === 'severity') {
    return [
      'add-client-form__fmh-table-actions-col',
      'client-overview-module-dialog__severity-col',
    ].join(' ')
  }

  return ''
}

function onClose() {
  emit('update:modelValue', false)
}
</script>
