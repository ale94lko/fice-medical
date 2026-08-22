<template>
  <div
    class="insurance-dialog__card-section q-mt-lg"
    :data-testid="tid.layoutRoot">
    <div class="row items-center q-mb-md">
      <h3 class="text-subtitle1 q-mb-none col">
        {{ t('documentLayoutTitle') }}
      </h3>
      <q-btn
        v-if="!readonly && !modelValue"
        no-caps
        outline
        color="primary"
        class="app-btn-outline"
        icon="add"
        :label="t('documentLayoutEnable')"
        :data-testid="tid.layoutEnable"
        @click="enableLayout"
      />
    </div>
    <p class="text-body2 text-grey-7 q-mb-md">
      {{ t('documentLayoutHelper') }}
    </p>

    <template v-if="layout">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-6">
          <FormToggle
            v-model="layout.header.enabled"
            :disable="readonly"
            :label="t('documentLayoutHeaderEnabled')"
            :test-id="tid.layoutField('header-enabled')"
          />
        </div>
        <div class="col-12 col-md-6">
          <FormToggle
            v-model="layout.footer.enabled"
            :disable="readonly"
            :label="t('documentLayoutFooterEnabled')"
            :test-id="tid.layoutField('footer-enabled')"
          />
        </div>
      </div>

      <p
        v-if="!layout.sections.length"
        class="text-body2 text-grey-7 q-mb-md">
        {{ t('documentLayoutEmpty') }}
      </p>

      <article
        v-for="(section, sectionIndex) in layout.sections"
        :key="section.id"
        class="q-pa-sm q-mb-md">
        <div class="row items-center q-col-gutter-sm q-mb-sm">
          <div class="col">
            <FormField :label="t('documentLayoutSectionTitle')">
              <TextInput
                v-model="section.title"
                outlined
                dense
                hide-bottom-space
                :readonly="readonly"
                :test-id="tid.layoutSectionTitle(section.id)"
              />
            </FormField>
          </div>
          <div
            v-if="!readonly"
            class="col-auto row q-gutter-xs no-wrap">
            <q-btn
              flat
              round
              dense
              icon="arrow_upward"
              class="app-btn-icon-action"
              :disable="sectionIndex === 0"
              :data-testid="tid.layoutSectionMoveUp(section.id)"
              :aria-label="t('consentFieldMoveUp')"
              @click="moveSection(sectionIndex, -1)"
            />
            <q-btn
              flat
              round
              dense
              icon="arrow_downward"
              class="app-btn-icon-action"
              :disable="sectionIndex === layout.sections.length - 1"
              :data-testid="tid.layoutSectionMoveDown(section.id)"
              :aria-label="t('consentFieldMoveDown')"
              @click="moveSection(sectionIndex, 1)"
            />
            <q-btn
              flat
              round
              dense
              icon="delete"
              class="app-btn-icon-action"
              :data-testid="tid.layoutSectionRemove(section.id)"
              :aria-label="t('delete')"
              @click="removeSection(sectionIndex)"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-12 col-md-4">
            <FormToggle
              v-model="section.showTitle"
              :disable="readonly"
              :label="t('documentLayoutShowTitle')"
              :test-id="tid.layoutSectionShowTitle(section.id)"
            />
          </div>
          <div class="col-12 col-md-4">
            <FormToggle
              v-model="section.pageBreakBefore"
              :disable="readonly"
              :label="t('documentLayoutPageBreakBefore')"
              :test-id="tid.layoutSectionBreak(section.id)"
            />
          </div>
          <div class="col-12 col-md-4">
            <FormToggle
              v-model="section.keepTogether"
              :disable="readonly"
              :label="t('documentLayoutKeepTogether')"
              :test-id="tid.layoutSectionKeep(section.id)"
            />
          </div>
        </div>

        <div
          v-for="(row, rowIndex) in section.rows"
          :key="row.id"
          class="q-mb-sm q-pa-sm">
          <div class="row items-center q-col-gutter-sm q-mb-sm">
            <div class="col-12 col-md-4">
              <FormField :label="t('documentLayoutColumnCount')">
                <FormSelect
                  :model-value="row.columnCount"
                  outlined
                  dense
                  emit-value
                  map-options
                  hide-bottom-space
                  :disable="readonly"
                  :options="columnCountOptions"
                  :test-id="tid.layoutRowColumns(row.id)"
                  @update:model-value="count => setRowColumns(
                    sectionIndex,
                    rowIndex,
                    count,
                  )"
                />
              </FormField>
            </div>
            <div
              v-if="!readonly"
              class="col-auto">
              <q-btn
                flat
                dense
                no-caps
                color="negative"
                :label="t('documentLayoutRemoveRow')"
                :data-testid="tid.layoutRowRemove(row.id)"
                @click="removeRow(sectionIndex, rowIndex)"
              />
            </div>
          </div>
          <div class="row q-col-gutter-sm">
            <div
              v-for="(column, columnIndex) in row.columns"
              :key="column.id"
              class="col-12"
              :class="columnClass(row.columnCount)">
              <p class="text-caption text-grey-7 q-mb-xs">
                {{ t('documentLayoutColumn', { n: columnIndex + 1 }) }}
              </p>
              <div
                v-for="(component, componentIndex) in column.components"
                :key="component.id"
                class="q-mb-sm">
                <FormField :label="t('documentLayoutComponentType')">
                  <FormSelect
                    v-model="component.type"
                    outlined
                    dense
                    emit-value
                    map-options
                    hide-bottom-space
                    :disable="readonly"
                    :options="componentTypeOptions"
                    :test-id="tid.layoutComponentType(component.id)"
                    @update:model-value="value => onComponentType(
                      component,
                      value,
                    )"
                  />
                </FormField>
                <FormField
                  v-if="needsFieldKey(component.type)"
                  class="q-mt-sm"
                  :label="t('documentLayoutField')">
                  <FormSelect
                    v-model="component.fieldKey"
                    outlined
                    dense
                    emit-value
                    map-options
                    hide-bottom-space
                    :disable="readonly"
                    :options="fieldOptions"
                    :test-id="tid.layoutComponentField(component.id)"
                  />
                </FormField>
                <FormField
                  v-if="component.type === types.table"
                  class="q-mt-sm"
                  :label="t('documentLayoutTableSource')">
                  <TextInput
                    v-model="component.sourceKey"
                    outlined
                    dense
                    hide-bottom-space
                    :readonly="readonly"
                    :test-id="tid.layoutComponentSource(component.id)"
                  />
                </FormField>
                <FormField
                  v-if="component.type === types.signatureBlock"
                  class="q-mt-sm"
                  :label="t('documentLayoutSignature')">
                  <FormSelect
                    v-model="component.requirementKey"
                    outlined
                    dense
                    emit-value
                    map-options
                    hide-bottom-space
                    :disable="readonly"
                    :options="signatureOptions"
                    :test-id="
                      tid.layoutComponentSignature(component.id)
                    "
                  />
                </FormField>
                <FormToggle
                  v-if="component.type === types.staticText"
                  class="q-mt-sm"
                  :model-value="component.sourceKey === 'content'"
                  :disable="readonly"
                  :label="t('documentLayoutUseTemplateHtml')"
                  :test-id="tid.layoutComponentSource(component.id)"
                  @update:model-value="value => {
                    component.sourceKey = value ? 'content' : ''
                  }"
                />
                <FormField
                  v-if="component.type === types.staticText
                    && component.sourceKey !== 'content'"
                  class="q-mt-sm"
                  :label="t('documentLayoutStaticText')">
                  <q-input
                    v-model="component.text"
                    outlined
                    type="textarea"
                    autogrow
                    :readonly="readonly"
                    :data-testid="
                      tid.layoutComponentText(component.id)
                    "
                  />
                </FormField>
                <q-btn
                  v-if="!readonly"
                  flat
                  dense
                  no-caps
                  color="negative"
                  class="q-mt-xs"
                  :label="t('documentLayoutRemoveComponent')"
                  :data-testid="
                    tid.layoutComponentRemove(component.id)
                  "
                  @click="removeComponent(
                    sectionIndex,
                    rowIndex,
                    columnIndex,
                    componentIndex,
                  )"
                />
              </div>
              <q-btn
                v-if="!readonly"
                no-caps
                outline
                dense
                color="primary"
                class="app-btn-outline"
                icon="add"
                :label="t('documentLayoutAddComponent')"
                :data-testid="tid.layoutColumnAdd(column.id)"
                @click="addComponent(
                  sectionIndex,
                  rowIndex,
                  columnIndex,
                )"
              />
            </div>
          </div>
        </div>
        <q-btn
          v-if="!readonly"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="add"
          :label="t('documentLayoutAddRow')"
          :data-testid="tid.layoutSectionAddRow(section.id)"
          @click="addRow(sectionIndex)"
        />
      </article>

      <q-btn
        v-if="!readonly"
        no-caps
        outline
        color="primary"
        class="app-btn-outline"
        icon="add"
        :label="t('documentLayoutAddSection')"
        :data-testid="tid.layoutAddSection"
        @click="addSection"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import TextInput from 'components/TextInput.vue'
import { consentVersionDialogTestIds as tid } from
  'src/test-ids/index.js'
import {
  documentLayoutColumnCountOptions,
  documentLayoutComponentTypeOptions,
  documentLayoutComponentTypes as types,
  emptyDocumentLayout,
  emptyLayoutComponent,
  emptyLayoutRow,
  emptyLayoutSection,
  resizeLayoutRowColumns,
} from 'src/utils/document-layout.js'

const props = defineProps({
  modelValue: { type: Object, default: null },
  fields: { type: Array, default: () => [] },
  signatureRequirements: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const layout = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const componentTypeOptions = computed(() => (
  documentLayoutComponentTypeOptions(t)
))
const columnCountOptions = documentLayoutColumnCountOptions()
const fieldOptions = computed(() => props.fields
  .filter(item => item?.key)
  .map(item => ({
    value: item.key,
    label: item.label || item.key,
  })))
const signatureOptions = computed(() => (
  props.signatureRequirements
    .filter(item => item?.key)
    .map(item => ({
      value: item.key,
      label: item.label || item.key,
    }))
))

function needsFieldKey(type) {
  return type === types.field || type === types.narrative
}

function columnClass(count) {
  if (count === 3) {
    return 'col-md-4'
  }
  if (count === 2) {
    return 'col-md-6'
  }

  return 'col-md-12'
}

function mutate(updater) {
  const next = JSON.parse(JSON.stringify(layout.value || {}))
  updater(next)
  layout.value = next
}

function enableLayout() {
  layout.value = emptyDocumentLayout()
}

function addSection() {
  mutate(next => {
    next.sections.push(emptyLayoutSection(next.sections.length))
  })
}

function removeSection(index) {
  mutate(next => {
    next.sections.splice(index, 1)
  })
}

function moveSection(index, delta) {
  const target = index + delta
  mutate(next => {
    if (target < 0 || target >= next.sections.length) {
      return
    }
    const [row] = next.sections.splice(index, 1)
    next.sections.splice(target, 0, row)
  })
}

function addRow(sectionIndex) {
  mutate(next => {
    next.sections[sectionIndex].rows.push(emptyLayoutRow(2))
  })
}

function removeRow(sectionIndex, rowIndex) {
  mutate(next => {
    next.sections[sectionIndex].rows.splice(rowIndex, 1)
  })
}

function setRowColumns(sectionIndex, rowIndex, count) {
  mutate(next => {
    const row = next.sections[sectionIndex].rows[rowIndex]
    next.sections[sectionIndex].rows[rowIndex] = resizeLayoutRowColumns(
      row,
      count,
    )
  })
}

function addComponent(sectionIndex, rowIndex, columnIndex) {
  mutate(next => {
    next.sections[sectionIndex]
      .rows[rowIndex]
      .columns[columnIndex]
      .components
      .push(emptyLayoutComponent(types.field))
  })
}

function onComponentType(component, type) {
  component.type = type
  if (type === types.table && !component.columns.length) {
    component.columns = [
      {
        id: `${component.id}-col-a`,
        label: '',
        fieldKey: 'name',
        sourceKey: '',
      },
      {
        id: `${component.id}-col-b`,
        label: '',
        fieldKey: 'value',
        sourceKey: '',
      },
    ]
  }
}

function removeComponent(
  sectionIndex,
  rowIndex,
  columnIndex,
  componentIndex,
) {
  mutate(next => {
    next.sections[sectionIndex]
      .rows[rowIndex]
      .columns[columnIndex]
      .components
      .splice(componentIndex, 1)
  })
}
</script>
