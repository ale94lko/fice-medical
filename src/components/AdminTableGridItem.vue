<template>
  <div
    class="q-pa-xs col-xs-12 admin-table-grid-item"
    :class="rowClass">
    <q-card
      flat
      bordered
      class="admin-table-grid-card admin-table-grid-card--compact">
      <div class="admin-table-grid-card__header">
        <DataItemComponent
          class="admin-table-grid-card__data-item"
          icon="person"
          icon-style="neutral"
          icon-size="44px"
          title-size="medium"
          :title="titleText"
          :avatar-text="avatarText"
          :sub-title="subtitleText">
          <template
            v-if="titleExtraCol && showField(titleExtraCol)"
            #subTitle>
            <slot
              :name="`body-cell-${titleExtraCol.name}`"
              v-bind="toCellScope(titleExtraCol)">
              {{ formatCardColValue(titleExtraCol) }}
            </slot>
          </template>
          <template
            v-if="statusCol && showField(statusCol)"
            #actions>
            <slot
              :name="`body-cell-${statusCol.name}`"
              v-bind="toCellScope(statusCol)">
                {{ formatCardColValue(statusCol) }}
            </slot>
          </template>
        </DataItemComponent>
      </div>

      <div
        v-if="hasBodyContent"
        class="admin-table-grid-card__body">
        <div
          v-if="identifierCol && showField(identifierCol)"
          class="admin-table-grid-card__field-row">
          <div class="admin-table-grid-card__field-label">
            {{ fieldLabel(identifierCol, identifierLabel) }}
          </div>
          <div
            class="admin-table-grid-card__field-value
              admin-table-grid-card__field-value--accent">
            <slot
              :name="`body-cell-${identifierCol.name}`"
              v-bind="toCellScope(identifierCol)">
              {{ formatCardColValue(identifierCol) }}
            </slot>
          </div>
        </div>

        <div
          v-for="col in bodyFieldCols"
          :key="col.name"
          class="admin-table-grid-card__field-row">
          <div class="admin-table-grid-card__field-label">
            {{ fieldLabel(col) }}
          </div>
          <div class="admin-table-grid-card__field-value">
            <slot
              :name="`body-cell-${col.name}`"
              v-bind="toCellScope(col)">
              {{ formatCardColValue(col) }}
            </slot>
          </div>
        </div>

        <div
          v-if="contactCol && showField(contactCol)"
          class="admin-table-grid-card__field-row
            admin-table-grid-card__field-row--stacked">
          <div class="admin-table-grid-card__field-label
            admin-table-grid-card__field-label--with-icon">
            <q-icon
              name="email"
              size="16px"
              class="admin-table-grid-card__field-icon"
            />
            <span>{{ contactCol.label || t('email') }}</span>
          </div>
          <div class="admin-table-grid-card__field-value">
            <slot
              :name="`body-cell-${contactCol.name}`"
              v-bind="toCellScope(contactCol)">
              {{ formatCardColValue(contactCol) }}
            </slot>
          </div>
        </div>
      </div>

      <div
        v-if="$slots.actions || footerBadgeCols.length"
        class="admin-table-grid-card__footer">
        <div class="admin-table-grid-card__footer-badges">
          <div
            v-for="col in footerBadgeCols"
            :key="col.name"
            class="admin-table-grid-card__footer-badge">
            <span>{{ col.label }}</span>
            <q-icon
              v-if="isIconBadge(col)"
              name="check"
              size="14px"
            />
          </div>
        </div>
        <q-card-actions
          v-if="$slots.actions"
          align="right"
          class="admin-table-grid-actions">
          <slot name="actions" :row="tableProps.row" />
        </q-card-actions>
      </div>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DataItemComponent from 'components/template/DataItemComponent.vue'
import {
  cardAvatarInitials,
  findCardColumn,
  formatCardColValue,
  isTruthyCardValue,
  resolveAdminTableCardLayout,
  shouldShowCardField,
} from 'src/utils/admin-table-card-layout.js'

const props = defineProps({
  tableProps: {
    type: Object,
    required: true,
  },
  rowClass: {
    type: [String, Array, Object],
    default: '',
  },
  /**
   * Compact mobile card hierarchy. See resolveAdminTableCardLayout().
   */
  cardLayout: {
    type: Object,
    default: null,
  },
  excludeColumns: {
    type: Array,
    default: () => ['actions'],
  },
})

const { t } = useI18n()

const rawCols = computed(() => {
  const cols = Array.isArray(props.tableProps?.cols)
    ? props.tableProps.cols
    : []
  const excluded = new Set(props.excludeColumns)

  return cols.filter(col => {
    if (!col?.name || excluded.has(col.name)) {
      return false
    }
    if (col.required === false && !col.field && !col.label) {
      return false
    }

    return true
  })
})

const layout = computed(() =>
  resolveAdminTableCardLayout(rawCols.value, props.cardLayout || {}),
)

const colsByName = computed(() => {
  const map = Object.create(null)
  rawCols.value.forEach(col => {
    map[col.name] = col
  })

  return map
})

const titleCol = computed(() =>
  findCardColumn(rawCols.value, layout.value.title),
)
const subtitleCol = computed(() =>
  findCardColumn(rawCols.value, layout.value.subtitle),
)
const titleExtraCol = computed(() =>
  findCardColumn(rawCols.value, layout.value.titleExtra),
)
const statusCol = computed(() =>
  findCardColumn(rawCols.value, layout.value.status),
)
const contactCol = computed(() =>
  findCardColumn(rawCols.value, layout.value.contact),
)
const identifierCol = computed(() =>
  findCardColumn(rawCols.value, layout.value.identifier?.column),
)

const titleText = computed(() =>
  formatCardColValue(titleCol.value) || '—',
)

const subtitleText = computed(() => {
  if (!subtitleCol.value || !showField(subtitleCol.value)) {
    return ''
  }

  return formatCardColValue(subtitleCol.value)
})

const avatarText = computed(() => cardAvatarInitials(titleText.value))

const identifierLabel = computed(() => {
  const meta = layout.value.identifier
  if (!meta) {
    return ''
  }
  if (meta.label) {
    return meta.label
  }
  if (meta.labelKey) {
    return t(meta.labelKey)
  }

  return identifierCol.value?.label || ''
})

const bodyFieldCols = computed(() =>
  layout.value.badges
    .map(name => findCardColumn(rawCols.value, name))
    .filter(col => showField(col)),
)

const footerBadgeCols = computed(() =>
  (layout.value.footerBadges || [])
    .map(name => findCardColumn(rawCols.value, name))
    .filter(col => showField(col)),
)

const hasBodyContent = computed(() => (
  (identifierCol.value && showField(identifierCol.value))
  || bodyFieldCols.value.length > 0
  || (contactCol.value && showField(contactCol.value))
))

function showField(col) {
  return shouldShowCardField(col, layout.value, colsByName.value)
}

function isIconBadge(col) {
  return col?.name === 'clinician' && isTruthyCardValue(col.value)
}

function fieldLabel(col, override = '') {
  const label = override || col?.label || ''
  if (!label) {
    return ''
  }

  return label.endsWith(':') ? label : `${label}:`
}

function toCellScope(col) {
  return {
    ...props.tableProps,
    col,
    value: col.value,
    key: col.name,
  }
}
</script>
