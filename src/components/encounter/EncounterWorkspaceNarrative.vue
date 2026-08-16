<template>
  <div
    class="encounter-workspace-note"
    :data-testid="tid.narrative">
    <section class="encounter-workspace-card">
      <div class="encounter-workspace-card__head">
        <div>
          <h2>{{ t('encounterNarrativeTitle') }}</h2>
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ headingHint }}
          </p>
        </div>
        <span
          v-if="savedFlash"
          class="text-positive text-body2">
          {{ t('encounterNarrativeSaved') }} ✓
        </span>
      </div>

      <p
        v-if="narrative?.warning"
        class="text-body2 text-warning q-mb-md">
        {{ narrative.warning }}
      </p>

      <div
        v-if="!fields.length"
        class="text-body2 text-grey-7">
        {{ emptyMessage }}
      </div>

      <div
        v-for="field in fields"
        :key="field.templateSectionId || field.fieldKey"
        class="q-mb-md">
        <AddClientLabeledField
          :label="field.fieldLabel"
          :required="field.required">
          <TextInput
            v-if="field.inputType === 'SHORT_TEXT'"
            :model-value="field.valueText"
            :external-label="true"
            :readonly="!canEdit"
            :placeholder="field.placeholder"
            :test-id="tid.narrativeField(field.fieldKey)"
            @update:model-value="onText(field, $event)"
            @blur="flushSave"
          />
          <q-editor
            v-else-if="field.inputType === 'RICH_TEXT'"
            :model-value="field.valueText"
            min-height="140px"
            :readonly="!canEdit"
            :placeholder="field.placeholder"
            :data-testid="tid.narrativeField(field.fieldKey)"
            @update:model-value="onText(field, $event)"
          />
          <div
            v-else-if="field.sectionType === 'STRUCTURED_SECTION'"
            :data-testid="tid.narrativeField(field.fieldKey)">
            <div
              v-for="item in structuredFields(field)"
              :key="item.key"
              class="q-mb-sm">
              <AddClientLabeledField :label="item.label">
                <TextInput
                  :model-value="structuredValue(field, item.key)"
                  :external-label="true"
                  :readonly="!canEdit"
                  @update:model-value="onStructured(
                    field,
                    item.key,
                    $event,
                  )"
                  @blur="flushSave"
                />
              </AddClientLabeledField>
            </div>
          </div>
          <TextInput
            v-else
            :model-value="field.valueText"
            type="textarea"
            autogrow
            :external-label="true"
            :readonly="!canEdit"
            :placeholder="field.placeholder"
            :test-id="tid.narrativeField(field.fieldKey)"
            @update:model-value="onText(field, $event)"
            @blur="flushSave"
          />
        </AddClientLabeledField>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import TextInput from 'components/TextInput.vue'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'
import {
  saveEncounterNarrative,
} from 'src/utils/encounter-narrative-api.js'

const props = defineProps({
  encounterId: { type: [String, Number], default: null },
  narrative: { type: Object, default: null },
  canEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['saved'])
const { t } = useI18n()
const $q = useQuasar()
const fields = ref([])
const savedFlash = ref(false)
const saving = ref(false)
let saveTimer = null
let flashTimer = null

const headingHint = computed(() => {
  const name = props.narrative?.templateName
  if (name) {
    return `${name}. ${t('encounterNarrativeHint')}`
  }

  return t('encounterNarrativeHint')
})

const emptyMessage = computed(() => {
  if (!props.narrative?.templateId) {
    return t('encounterNarrativeNoTemplate')
  }

  return t('encounterNarrativeEmpty')
})

watch(
  () => props.narrative,
  value => {
    fields.value = Array.isArray(value?.fields)
      ? value.fields.map(field => ({ ...field }))
      : []
  },
  { immediate: true, deep: true },
)

function parseConfig(field) {
  const raw = field?.configurationJson
  if (!raw) {
    return {}
  }
  if (typeof raw === 'object') {
    return raw
  }
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function structuredFields(field) {
  const config = parseConfig(field)
  const list = Array.isArray(config.fields) ? config.fields : []
  if (list.length) {
    return list.map(item => ({
      key: item.key || item.id || item.label,
      label: item.label || item.key || '',
    }))
  }

  return [{ key: 'value', label: field.fieldLabel }]
}

function structuredMap(field) {
  if (field.valueJson && typeof field.valueJson === 'object') {
    return { ...field.valueJson }
  }
  if (typeof field.valueJson === 'string' && field.valueJson.trim()) {
    try {
      const parsed = JSON.parse(field.valueJson)

      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  return {}
}

function structuredValue(field, key) {
  return structuredMap(field)[key] ?? ''
}

function scheduleSave() {
  if (!props.canEdit) {
    return
  }
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
  saveTimer = setTimeout(() => {
    saveTimer = null
    void persist()
  }, 700)
}

function onText(field, value) {
  field.valueText = value
  scheduleSave()
}

function onStructured(field, key, value) {
  const next = structuredMap(field)
  next[key] = value
  field.valueJson = JSON.stringify(next)
  scheduleSave()
}

function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  void persist()
}

async function persist() {
  const id = props.encounterId
  if (!id || !props.canEdit || saving.value || !fields.value.length) {
    return
  }
  saving.value = true
  try {
    const saved = await saveEncounterNarrative(id, fields.value)
    fields.value = saved.fields.map(field => ({ ...field }))
    emit('saved', saved)
    savedFlash.value = true
    if (flashTimer) {
      clearTimeout(flashTimer)
    }
    flashTimer = setTimeout(() => {
      savedFlash.value = false
    }, 1600)
  } catch (error) {
    const status = error?.response?.status
    $q.notify({
      type: 'negative',
      message: status === 409
        ? t('encounterNarrativeConflict')
        : (error?.response?.data?.error_description
          || t('encounterNarrativeSaveError')),
    })
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (flashTimer) {
    clearTimeout(flashTimer)
  }
  void persist()
})
</script>
