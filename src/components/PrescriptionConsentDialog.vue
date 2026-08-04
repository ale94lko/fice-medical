<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="dialogTestId"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('medicationConsentTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ t('medicationConsentSubtitle') }}
        </p>

        <div class="row q-col-gutter-md">
          <div class="col-12">
            <FormToggle
              v-model="local.consentGiven"
              :disable="readonly"
              :label="t('medicationConsentLabel')"
              :test-id="tid.field('consent-toggle')"
            />
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('medicationConsentNotes')"
              :test-id="tid.field('consent-notes')">
              <q-input
                v-model="local.notes"
                outlined
                hide-bottom-space
                type="textarea"
                autogrow
                counter
                :readonly="readonly"
                :maxlength="medicationConsentNotesMaxLength"
                :placeholder="t('medicationConsentNotesPlaceholder')"
                :data-testid="tid.field('consent-notes')"
              />
            </AddClientLabeledField>
          </div>
        </div>

        <div v-if="hasMetadata" class="prescription-consent-dialog__meta">
          <p
            v-if="consentedAtDisplay"
            class="text-caption text-grey-7 q-mb-xs">
            {{ t('medicationConsentedAt', { date: consentedAtDisplay }) }}
          </p>
          <p
            v-if="updatedAtDisplay"
            class="text-caption text-grey-7 q-mb-none">
            {{ t('medicationConsentUpdatedAt', { date: updatedAtDisplay }) }}
          </p>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          :data-testid="tid.btn('consent-cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('medicationConsentSave')"
          :loading="saving"
          :disable="saving"
          :data-testid="tid.btn('consent-save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from './AppDialogHeader.vue'
import AddClientLabeledField from './AddClientLabeledField.vue'
import FormToggle from './FormToggle.vue'
import { medicationConsentNotesMaxLength } from './constants.js'
import { medicationTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'view',
  },
  consent: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const { t } = useI18n()

const local = reactive({
  consentGiven: false,
  notes: '',
})

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode !== 'edit' || !props.canEdit)

const dialogTestId = computed(() => tid.dialog(props.mode))

const consentedAtDisplay = computed(() => props.consent?.consentedAt || '')
const updatedAtDisplay = computed(() => props.consent?.updatedAt || '')

const hasMetadata = computed(
  () => Boolean(consentedAtDisplay.value || updatedAtDisplay.value),
)

watch(
  () => [props.modelValue, props.consent],
  () => {
    if (!props.modelValue) {
      return
    }
    const source = props.consent ?? {}
    local.consentGiven = Boolean(source.consentGiven)
    local.notes = String(source.notes ?? '')
  },
  { immediate: true },
)

function onCancel() {
  emit('cancel')
  open.value = false
}

function onSave() {
  emit('save', {
    consentGiven: local.consentGiven,
    notes: local.notes.trim(),
  })
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.prescription-consent-dialog__meta {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid $border-subtle;
}
</style>
