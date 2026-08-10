<template>
  <template v-if="canGenerateDocuments">
    <slot
      name="trigger"
      :open="openFromTrigger"
      :has-options="hasOptions">
      <q-btn
        no-caps
        :outline="outline"
        :unelevated="!outline"
        :flat="flat"
        :dense="dense"
        :size="size"
        color="primary"
        :class="buttonClass"
        :icon="icon"
        :icon-right="hasOptions ? 'arrow_drop_down' : undefined"
        :label="label || t('generateDocumentAction')"
        :data-testid="documentGenerationTestIds.trigger(
          activeDocumentType || documentType,
        )"
        @click="onTriggerClick">
        <q-menu
          v-if="hasOptions"
          auto-close
          anchor="bottom right"
          self="top right">
          <q-list
            dense
            class="generate-document-action__menu-list">
            <q-item
              v-for="option in resolvedOptions"
              :key="option.documentType"
              v-close-popup
              clickable
              :data-testid="documentGenerationTestIds.menuItem(
                option.documentType,
              )"
              @click="openDialog(option.documentType)">
              <q-item-section>
                {{ option.label }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </slot>

    <GenerateDocumentDialog
      v-if="activeDocumentType"
      v-model="dialogOpen"
      :document-type="activeDocumentType"
      :context="context"
      @generated="emit('generated', $event)"
    />
  </template>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import GenerateDocumentDialog from
  'components/documents/GenerateDocumentDialog.vue'
import { useDocumentGenerationPermissions } from
  'src/composables/useDocumentGenerationPermissions.js'
import { documentGenerationTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  documentType: {
    type: String,
    default: '',
  },
  /**
   * When set, the trigger opens a menu of document types instead of
   * generating a single type immediately.
   * [{ documentType, label?, labelKey? }]
   */
  options: {
    type: Array,
    default: null,
  },
  context: {
    type: Object,
    default: () => ({}),
  },
  label: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'download',
  },
  outline: {
    type: Boolean,
    default: true,
  },
  flat: {
    type: Boolean,
    default: false,
  },
  dense: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'md',
  },
  buttonClass: {
    type: String,
    default: 'app-btn-outline',
  },
})

const emit = defineEmits(['generated'])

const { t, te } = useI18n()
const { canGenerateDocuments } = useDocumentGenerationPermissions()
const dialogOpen = ref(false)
const activeDocumentType = ref(
  String(props.documentType ?? '').trim()
  || String(props.options?.[0]?.documentType ?? '').trim(),
)

const hasOptions = computed(
  () => Array.isArray(props.options) && props.options.length > 0,
)

const resolvedOptions = computed(() => {
  if (!hasOptions.value) {
    return []
  }

  return props.options
    .map(option => {
      const documentType = String(option?.documentType ?? '').trim()
      if (!documentType) {
        return null
      }
      const labelKey = String(option?.labelKey ?? '').trim()
      const explicitLabel = String(option?.label ?? '').trim()
      let label = explicitLabel
      if (!label && labelKey && te(labelKey)) {
        label = t(labelKey)
      }
      if (!label) {
        label = documentType
      }

      return { documentType, label }
    })
    .filter(Boolean)
})

watch(
  () => props.documentType,
  value => {
    const next = String(value ?? '').trim()
    if (next && !dialogOpen.value) {
      activeDocumentType.value = next
    }
  },
)

function openDialog(documentType) {
  const next = String(documentType ?? props.documentType ?? '').trim()
  if (!next) {
    return
  }
  activeDocumentType.value = next
  dialogOpen.value = true
}

function onTriggerClick(event) {
  if (hasOptions.value) {
    return
  }
  event?.preventDefault?.()
  openDialog(props.documentType)
}

function openFromTrigger(documentType) {
  if (documentType) {
    openDialog(documentType)

    return
  }
  if (hasOptions.value) {
    return
  }
  openDialog(props.documentType)
}

defineExpose({ openDialog })
</script>

<style lang="scss" scoped>
.generate-document-action__menu-list {
  min-width: 180px;
}
</style>
