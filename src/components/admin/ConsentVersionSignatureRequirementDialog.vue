<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(tid.requirementEditorDialog)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        :test-id="tid.requirementEditorDialog"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md
        q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('consentSignatureRequirementHint') }}
        </p>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <FormField required :label="t('consentSignatureRequirementLabel')">
              <TextInput
                v-model="local.label"
                outlined
                dense
                hide-bottom-space
                :maxlength="255"
                :test-id="tid.field('requirement-label')"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField :label="t('consentSignatureRequirementKey')">
              <TextInput
                v-model="local.key"
                outlined
                dense
                hide-bottom-space
                :maxlength="80"
                :placeholder="t('consentFieldKeyPlaceholder')"
                :test-id="tid.field('requirement-key')"
              />
            </FormField>
          </div>
          <div class="col-12">
            <FormField
              required
              :label="t('consentSignatureRequirementRoles')">
              <FormSelect
                v-model="local.allowedSignerTypes"
                outlined
                dense
                multiple
                emit-value
                map-options
                hide-bottom-space
                :options="signerOptions"
                :test-id="tid.field('requirement-roles')"
              />
            </FormField>
          </div>
          <div class="col-12">
            <FormToggle
              v-model="local.required"
              :label="t('consentSignatureRequirementRequired')"
              :test-id="tid.field('requirement-required')"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          :data-testid="modalTestIds.cancel(tid.requirementEditorDialog)"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('save')"
          :disable="!canSave"
          :data-testid="tid.requirementSave"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import TextInput from 'components/TextInput.vue'
import {
  consentVersionDialogTestIds as tid,
  modalTestIds,
} from 'src/test-ids/index.js'
import { buildConsentSignerTypeOptions } from 'src/utils/consent-i18n.js'
import {
  emptyConsentSignatureRequirement,
} from 'src/utils/consent-signature-requirements.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  requirement: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'save'])
const { t, te } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const local = reactive(emptyConsentSignatureRequirement())
const signerOptions = computed(() =>
  buildConsentSignerTypeOptions(t, te),
)
const dialogTitle = computed(() => (
  props.requirement?.key || props.requirement?.label
    ? t('consentSignatureRequirementEditTitle')
    : t('consentSignatureRequirementAddTitle')
))
const canSave = computed(() => Boolean(
  String(local.label ?? '').trim()
  && Array.isArray(local.allowedSignerTypes)
  && local.allowedSignerTypes.length,
))

watch(
  () => [open.value, props.requirement],
  ([isOpen]) => {
    if (!isOpen) {
      return
    }
    const source = props.requirement ?? emptyConsentSignatureRequirement()
    Object.assign(local, emptyConsentSignatureRequirement(), {
      key: source.key ?? '',
      label: source.label ?? '',
      required: source.required !== false,
      displayOrder: source.displayOrder ?? 0,
      allowedSignerTypes: Array.isArray(source.allowedSignerTypes)
        ? [...source.allowedSignerTypes]
        : [source.allowedSignerTypes].filter(Boolean),
      active: source.active !== false,
    })
  },
)

function onCancel() {
  open.value = false
}

function onSave() {
  if (!canSave.value) {
    return
  }
  emit('save', { ...local })
  open.value = false
}
</script>
