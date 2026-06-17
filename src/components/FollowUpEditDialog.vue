<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="allergy-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        ref="dialogBodyScrollRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <FollowUpFormFields
          v-model="localDraft"
          :errors="errors"
          :readonly="readonly"
          :clinician-options="clinicianOptions"
          :reference-options="referenceOptions"
          :reference-loading="referenceLoading"
          @related-to-change="onRelatedToChange"
        />
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          :data-testid="tid.btn('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :label="saveButtonLabel"
          :data-testid="tid.btn('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FollowUpFormFields from 'components/FollowUpFormFields.vue'
import { useFollowUpReferenceSources } from
  'src/composables/useFollowUpReferenceSources.js'
import {
  createEmptyFollowUpDraft,
  followUpDraftFromRecord,
  validateFollowUpDraft,
} from 'src/utils/follow-up-utils.js'
import { followUpTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  record: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'edit',
  },
  saving: {
    type: Boolean,
    default: false,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
  referenceContext: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const { t } = useI18n()

const {
  referenceOptions,
  referenceLoading,
  ensureLoadedForRelatedTo,
} = useFollowUpReferenceSources(
  toRef(props, 'clientId'),
  toRef(props, 'referenceContext'),
)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')
const isAddMode = computed(() => props.mode === 'add')
const localDraft = ref(createEmptyFollowUpDraft())
const errors = ref({})

const dialogTitle = computed(() => {
  if (readonly.value) {
    return t('followUpViewTitle')
  }
  if (isAddMode.value) {
    return t('followUpAddTitle')
  }

  return t('followUpEditTitle')
})

const saveButtonLabel = computed(() =>
  isAddMode.value ? t('followUpAddButton') : t('save'),
)

async function syncReferenceSources(relatedTo) {
  await ensureLoadedForRelatedTo(relatedTo)
}

watch(
  () => [props.modelValue, props.record, props.mode],
  async() => {
    if (!props.modelValue) {
      return
    }
    localDraft.value = props.mode === 'add'
      ? createEmptyFollowUpDraft()
      : followUpDraftFromRecord(props.record ?? {})
    errors.value = {}
    if (localDraft.value.relatedTo) {
      await syncReferenceSources(localDraft.value.relatedTo)
    }
  },
  { deep: true },
)

async function onRelatedToChange(relatedTo) {
  await syncReferenceSources(relatedTo)
}

function onCancel() {
  open.value = false
  emit('cancel')
}

function onSave() {
  errors.value = validateFollowUpDraft(localDraft.value, t, {
    referenceOptions: referenceOptions.value,
  })
  if (Object.keys(errors.value).length > 0) {
    return
  }
  emit('save', { ...localDraft.value })
}
</script>
