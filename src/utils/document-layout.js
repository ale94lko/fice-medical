export const documentLayoutComponentTypes = {
  field: 'FIELD',
  narrative: 'NARRATIVE',
  table: 'TABLE',
  signatureBlock: 'SIGNATURE_BLOCK',
  staticText: 'STATIC_TEXT',
  pageBreak: 'PAGE_BREAK',
  spacer: 'SPACER',
}

export const documentLayoutColumnCounts = [1, 2, 3]

export const documentLayoutStylePresets = [
  'DOCUMENT_HEADER',
  'SECTION_HEADER',
  'INFO_CARD',
  'CLINICAL_TABLE',
  'RESULT_CARD',
  'NARRATIVE_BLOCK',
  'SIGNATURE_PANEL',
  'LEGAL_TEXT',
  'DOCUMENT_FOOTER',
]

function nextId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`
}

export function emptyDocumentLayoutChrome(enabled = true) {
  return {
    enabled: enabled !== false,
    stylePreset: enabled ? 'DOCUMENT_HEADER' : 'DOCUMENT_FOOTER',
    showLogo: true,
    showOrganizationName: true,
    showAddress: true,
    showPhone: true,
    showFax: true,
    showEmail: true,
    showWebsite: false,
    showPageNumbers: true,
  }
}

export function emptyLayoutComponent(type = 'FIELD') {
  return {
    id: nextId('c'),
    type,
    fieldKey: '',
    sourceKey: '',
    requirementKey: '',
    text: '',
    showLabel: true,
    emptyValueBehavior: 'HIDE',
    stylePreset: type === 'NARRATIVE'
      ? 'NARRATIVE_BLOCK'
      : 'INFO_CARD',
    columns: [],
  }
}

export function emptyLayoutRow(columnCount = 2) {
  const count = documentLayoutColumnCounts.includes(columnCount)
    ? columnCount
    : 1
  return {
    id: nextId('r'),
    columnCount: count,
    keepTogether: false,
    columns: Array.from({ length: count }, () => ({
      id: nextId('col'),
      components: [],
    })),
  }
}

export function emptyLayoutSection(order = 0) {
  return {
    id: nextId('s'),
    title: '',
    displayOrder: order,
    showTitle: true,
    stylePreset: 'SECTION_HEADER',
    keepTogether: false,
    pageBreakBefore: false,
    pageBreakAfter: false,
    rows: [emptyLayoutRow(2)],
  }
}

export function emptyDocumentLayout() {
  return {
    header: emptyDocumentLayoutChrome(true),
    footer: {
      ...emptyDocumentLayoutChrome(true),
      stylePreset: 'DOCUMENT_FOOTER',
      showLogo: false,
    },
    sections: [],
  }
}

function normalizeChrome(raw, fallbackPreset) {
  const row = raw ?? {}
  return {
    enabled: row.enabled !== false,
    stylePreset: String(row.style_preset ?? row.stylePreset
      ?? fallbackPreset),
    showLogo: row.show_logo ?? row.showLogo !== false,
    showOrganizationName: row.show_organization_name
      ?? row.showOrganizationName !== false,
    showAddress: row.show_address ?? row.showAddress !== false,
    showPhone: row.show_phone ?? row.showPhone !== false,
    showFax: row.show_fax ?? row.showFax !== false,
    showEmail: row.show_email ?? row.showEmail !== false,
    showWebsite: Boolean(row.show_website ?? row.showWebsite),
    showPageNumbers: row.show_page_numbers
      ?? row.showPageNumbers !== false,
  }
}

function normalizeComponent(raw) {
  const row = raw ?? {}
  return {
    id: String(row.id ?? nextId('c')),
    type: String(row.type ?? 'FIELD').toUpperCase(),
    fieldKey: String(row.field_key ?? row.fieldKey ?? ''),
    sourceKey: String(row.source_key ?? row.sourceKey ?? ''),
    requirementKey: String(
      row.requirement_key ?? row.requirementKey ?? '',
    ),
    text: String(row.text ?? ''),
    showLabel: row.show_label ?? row.showLabel !== false,
    emptyValueBehavior: String(
      row.empty_value_behavior ?? row.emptyValueBehavior ?? 'HIDE',
    ).toUpperCase(),
    stylePreset: String(row.style_preset ?? row.stylePreset ?? ''),
    columns: Array.isArray(row.columns)
      ? row.columns.map(item => ({
        id: String(item?.id ?? nextId('tc')),
        label: String(item?.label ?? ''),
        fieldKey: String(item?.field_key ?? item?.fieldKey ?? ''),
        sourceKey: String(item?.source_key ?? item?.sourceKey ?? ''),
      }))
      : [],
  }
}

function normalizeRow(raw) {
  const row = raw ?? {}
  let count = Number(row.column_count ?? row.columnCount ?? 1)
  if (!documentLayoutColumnCounts.includes(count)) {
    count = 1
  }
  const columns = Array.isArray(row.columns) ? row.columns : []
  const normalized = columns.slice(0, count).map(column => ({
    id: String(column?.id ?? nextId('col')),
    components: Array.isArray(column?.components)
      ? column.components.map(normalizeComponent)
      : [],
  }))
  while (normalized.length < count) {
    normalized.push({ id: nextId('col'), components: [] })
  }
  return {
    id: String(row.id ?? nextId('r')),
    columnCount: count,
    keepTogether: Boolean(row.keep_together ?? row.keepTogether),
    columns: normalized,
  }
}

export function normalizeDocumentLayout(raw) {
  if (raw == null || raw === '') {
    return null
  }
  const row = raw
  return {
    header: normalizeChrome(row.header, 'DOCUMENT_HEADER'),
    footer: normalizeChrome(row.footer, 'DOCUMENT_FOOTER'),
    sections: Array.isArray(row.sections)
      ? row.sections.map((section, index) => ({
        id: String(section?.id ?? nextId('s')),
        title: String(section?.title ?? ''),
        displayOrder: Number.isFinite(Number(section?.display_order
          ?? section?.displayOrder))
          ? Number(section?.display_order ?? section?.displayOrder)
          : index,
        showTitle: section?.show_title ?? section?.showTitle !== false,
        stylePreset: String(
          section?.style_preset ?? section?.stylePreset
            ?? 'SECTION_HEADER',
        ),
        keepTogether: Boolean(
          section?.keep_together ?? section?.keepTogether,
        ),
        pageBreakBefore: Boolean(
          section?.page_break_before ?? section?.pageBreakBefore,
        ),
        pageBreakAfter: Boolean(
          section?.page_break_after ?? section?.pageBreakAfter,
        ),
        rows: Array.isArray(section?.rows)
          ? section.rows.map(normalizeRow)
          : [],
      }))
      : [],
  }
}

export function buildDocumentLayoutBody(layout) {
  if (!layout) {
    return null
  }
  return {
    header: {
      enabled: layout.header?.enabled !== false,
      /* eslint-disable-next-line camelcase -- API body */
      style_preset: layout.header?.stylePreset || 'DOCUMENT_HEADER',
      /* eslint-disable-next-line camelcase -- API body */
      show_logo: layout.header?.showLogo !== false,
      /* eslint-disable-next-line camelcase -- API body */
      show_organization_name:
        layout.header?.showOrganizationName !== false,
      /* eslint-disable-next-line camelcase -- API body */
      show_address: layout.header?.showAddress !== false,
      /* eslint-disable-next-line camelcase -- API body */
      show_phone: layout.header?.showPhone !== false,
      /* eslint-disable-next-line camelcase -- API body */
      show_fax: layout.header?.showFax !== false,
      /* eslint-disable-next-line camelcase -- API body */
      show_email: layout.header?.showEmail !== false,
      /* eslint-disable-next-line camelcase -- API body */
      show_page_numbers: layout.header?.showPageNumbers !== false,
    },
    footer: {
      enabled: layout.footer?.enabled !== false,
      /* eslint-disable-next-line camelcase -- API body */
      style_preset: layout.footer?.stylePreset || 'DOCUMENT_FOOTER',
      /* eslint-disable-next-line camelcase -- API body */
      show_logo: false,
      /* eslint-disable-next-line camelcase -- API body */
      show_organization_name:
        layout.footer?.showOrganizationName !== false,
      /* eslint-disable-next-line camelcase -- API body */
      show_page_numbers: layout.footer?.showPageNumbers !== false,
    },
    sections: (layout.sections ?? []).map((section, index) => ({
      id: section.id,
      title: section.title,
      /* eslint-disable-next-line camelcase -- API body */
      display_order: index,
      /* eslint-disable-next-line camelcase -- API body */
      show_title: section.showTitle !== false,
      /* eslint-disable-next-line camelcase -- API body */
      style_preset: section.stylePreset || 'SECTION_HEADER',
      /* eslint-disable-next-line camelcase -- API body */
      keep_together: Boolean(section.keepTogether),
      /* eslint-disable-next-line camelcase -- API body */
      page_break_before: Boolean(section.pageBreakBefore),
      /* eslint-disable-next-line camelcase -- API body */
      page_break_after: Boolean(section.pageBreakAfter),
      rows: (section.rows ?? []).map(row => ({
        id: row.id,
        /* eslint-disable-next-line camelcase -- API body */
        column_count: row.columnCount,
        /* eslint-disable-next-line camelcase -- API body */
        keep_together: Boolean(row.keepTogether),
        columns: (row.columns ?? []).map(column => ({
          id: column.id,
          components: (column.components ?? []).map(component => ({
            id: component.id,
            type: component.type,
            /* eslint-disable-next-line camelcase -- API body */
            field_key: component.fieldKey || null,
            /* eslint-disable-next-line camelcase -- API body */
            source_key: component.sourceKey || null,
            /* eslint-disable-next-line camelcase -- API body */
            requirement_key: component.requirementKey || null,
            text: component.text || null,
            /* eslint-disable-next-line camelcase -- API body */
            show_label: component.showLabel !== false,
            /* eslint-disable-next-line camelcase -- API body */
            empty_value_behavior:
              component.emptyValueBehavior || 'HIDE',
            /* eslint-disable-next-line camelcase -- API body */
            style_preset: component.stylePreset || null,
            columns: (component.columns ?? []).map(item => ({
              id: item.id,
              label: item.label || null,
              /* eslint-disable-next-line camelcase -- API body */
              field_key: item.fieldKey || null,
              /* eslint-disable-next-line camelcase -- API body */
              source_key: item.sourceKey || null,
            })),
          })),
        })),
      })),
    })),
  }
}

export function documentLayoutComponentTypeOptions(t) {
  return [
    {
      value: documentLayoutComponentTypes.field,
      label: t('documentLayoutComponentField'),
    },
    {
      value: documentLayoutComponentTypes.narrative,
      label: t('documentLayoutComponentNarrative'),
    },
    {
      value: documentLayoutComponentTypes.staticText,
      label: t('documentLayoutComponentStaticText'),
    },
    {
      value: documentLayoutComponentTypes.signatureBlock,
      label: t('documentLayoutComponentSignature'),
    },
    {
      value: documentLayoutComponentTypes.table,
      label: t('documentLayoutComponentTable'),
    },
    {
      value: documentLayoutComponentTypes.pageBreak,
      label: t('documentLayoutComponentPageBreak'),
    },
    {
      value: documentLayoutComponentTypes.spacer,
      label: t('documentLayoutComponentSpacer'),
    },
  ]
}

export function documentLayoutColumnCountOptions() {
  return documentLayoutColumnCounts.map(count => ({
    value: count,
    label: String(count),
  }))
}

const stylePresetI18nKeys = {
  DOCUMENT_HEADER: 'documentLayoutPresetHeader',
  SECTION_HEADER: 'documentLayoutPresetSection',
  INFO_CARD: 'documentLayoutPresetInfoCard',
  CLINICAL_TABLE: 'documentLayoutPresetTable',
  RESULT_CARD: 'documentLayoutPresetResult',
  NARRATIVE_BLOCK: 'documentLayoutPresetNarrative',
  SIGNATURE_PANEL: 'documentLayoutPresetSignature',
  LEGAL_TEXT: 'documentLayoutPresetLegal',
  DOCUMENT_FOOTER: 'documentLayoutPresetFooter',
}

export function documentLayoutStylePresetOptions(t) {
  return documentLayoutStylePresets.map(value => ({
    value,
    label: t(stylePresetI18nKeys[value] || value),
  }))
}

export function resizeLayoutRowColumns(row, columnCount) {
  const count = documentLayoutColumnCounts.includes(columnCount)
    ? columnCount
    : 1
  const columns = Array.isArray(row?.columns) ? [...row.columns] : []
  while (columns.length < count) {
    columns.push({ id: nextId('col'), components: [] })
  }
  return {
    ...row,
    columnCount: count,
    columns: columns.slice(0, count),
  }
}

export function hasDocumentLayoutContent(layout) {
  if (!layout) {
    return false
  }
  return Array.isArray(layout.sections) && layout.sections.length > 0
}

