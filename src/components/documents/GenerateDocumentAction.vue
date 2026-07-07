<template>
  <template v-if="canGenerateDocuments">
    <slot name="trigger" :open="openDialog">
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
        :label="label || t('generateDocumentAction')"
        :data-testid="documentGenerationTestIds.trigger(documentType)"
        @click="openDialog"
      />
    </slot>

    <GenerateDocumentDialog
      v-model="dialogOpen"
      :document-type="documentType"
      :context="context"
      @generated="emit('generated', $event)"
    />
  </template>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GenerateDocumentDialog from
  'components/documents/GenerateDocumentDialog.vue'
import { useDocumentGenerationPermissions } from
  'src/composables/useDocumentGenerationPermissions.js'
import { documentGenerationTestIds } from 'src/test-ids/index.js'

defineProps({
  documentType: {
    type: String,
    required: true,
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

const { t } = useI18n()
const { canGenerateDocuments } = useDocumentGenerationPermissions()
const dialogOpen = ref(false)

function openDialog() {
  dialogOpen.value = true
}

defineExpose({ openDialog })
</script>
