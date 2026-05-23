<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="v => emit('update:modelValue', v)">
    <q-card class="add-client-card column no-wrap">
      <q-banner
        v-if="successVisible"
        dense
        class="bg-positive text-white text-center">
        {{ t('clientSavedSuccess') }}
      </q-banner>

      <q-toolbar class="app-dialog-toolbar">
        <q-toolbar-title>{{ t('addClient') }}</q-toolbar-title>
        <q-space />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary q-mr-sm"
          :loading="saving"
          :disable="saving"
          :label="t('save')"
          @click="onSave"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="saving"
          :label="t('close')"
          @click="onClose"
        />
      </q-toolbar>

      <q-card-section class="q-pt-md">
        <div class="row items-center justify-between q-mb-md">
          <q-tabs
            v-model="activeTab"
            dense
            no-caps
            class="add-client-tabs"
            active-color="white"
            indicator-color="transparent"
            align="left">
            <q-tab
              :name="addClientTabKeys.basic"
              :label="t('tabBasicInformation')"
            />
            <q-tab
              :name="addClientTabKeys.contact"
              :label="t('tabContactInformation')"
            />
            <q-tab
              :name="addClientTabKeys.medicalHistory"
              :label="t('tabFamilyMedicalHistory')"
            />
          </q-tabs>
          <q-badge
            outline
            color="grey-7"
            class="client-number-badge text-body2 q-px-md q-py-sm">
            {{ t('clientNumber') }}: {{ form[ck.clientNumber] }}
          </q-badge>
        </div>

        <q-form
          ref="formRef"
          greedy
          novalidate
          autocomplete="off"
          @submit.prevent="onSave">
          <q-tab-panels v-model="activeTab" animated class="bg-transparent">
            <q-tab-panel :name="addClientTabKeys.basic" class="q-pa-none">
              <div class="row q-col-gutter-lg">
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.firstName]"
                    :label="requiredLabel(t('firstName'))"
                    :rules="rules.firstName"
                  />
                  <TextInput
                    v-model="form[ck.lastName]"
                    :label="requiredLabel(t('lastName'))"
                    :rules="rules.lastName"
                  />
                  <ClientDateField
                    v-model="form[ck.dob]"
                    :label="t('dob')"
                    :rules="rules.dob"
                    :close-label="t('close')"
                  />
                  <q-option-group
                    v-model="form[ck.sex]"
                    :options="sexOptions"
                    type="radio"
                    inline
                    class="q-mt-sm"
                    :label="t('sex')"
                  />
                  <ClientDateField
                    v-model="form[ck.admissionDate]"
                    :label="requiredLabel(t('admissionDate'))"
                    :rules="rules.admissionDate"
                    :max-today="true"
                    :close-label="t('close')"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <TextInput
                    v-model="form[ck.middleName]"
                    :label="t('middleName')"
                    :rules="rules.middleName"
                  />
                  <q-select
                    v-model="form[ck.suffix]"
                    outlined
                    emit-value
                    map-options
                    :options="suffixSelectOptions"
                    :label="t('suffix')"
                  />
                  <q-input
                    v-model="form[ck.age]"
                    outlined
                    type="number"
                    :readonly="ageReadonly"
                    :label="t('age')"
                    :rules="rules.age"
                    :filled="ageReadonly"
                    min="0"
                    :max="clientMaxAge"
                  />
                  <q-input
                    outlined
                    :label="t('socialSecurityNumber')"
                    :model-value="ssnDisplayValue"
                    :rules="rules.ssn"
                    maxlength="11"
                    @focus="onSsnFocus"
                    @blur="onSsnBlur"
                    @update:model-value="onSsnInput"
                  />
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel :name="addClientTabKeys.contact" class="q-pa-none">
              <div class="text-body1 text-grey-7 q-py-xl text-center">
                {{ t('tabComingSoon') }}
              </div>
            </q-tab-panel>

            <q-tab-panel
              :name="addClientTabKeys.medicalHistory"
              class="q-pa-none">
              <div class="text-body1 text-grey-7 q-py-xl text-center">
                {{ t('tabComingSoon') }}
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md q-mt-auto">
        <q-btn
          v-if="canGoNext()"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('next')"
          :disable="saving"
          @click="onNext"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <ModalComponent
    v-model="cancelConfirmOpen"
    :title="t('cancelClientRegistrationTitle')"
    :message="t('cancelClientRegistrationMessage')"
    :confirm-text="t('confirm')"
    :cancel-text="t('cancel')"
    @confirm="confirmClose"
    @cancel="cancelConfirmOpen = false"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import TextInput from 'components/TextInput.vue'
import ClientDateField from 'components/ClientDateField.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { useSiteStore } from 'stores/site-store.js'
import { useAddClientForm } from 'src/composables/useAddClientForm.js'
import {
  clientMaxAge,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  formatSsnMasked,
  normalizeSsnDigits,
} from 'src/utils/client-form.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const $q = useQuasar()
const { t } = useI18n()
const siteStore = useSiteStore()

const saving = ref(false)
const successVisible = ref(false)
const cancelConfirmOpen = ref(false)
const ssnEditing = ref(false)

const {
  ck,
  form,
  formRef,
  activeTab,
  addClientTabKeys,
  ageReadonly,
  sexOptions,
  suffixSelectOptions,
  rules,
  resetForm,
  markPristine,
  isDirty,
  goNextTab,
  canGoNext,
  validateBasicTab,
} = useAddClientForm(t)

const ssnDisplayValue = computed(() => {
  const digits = normalizeSsnDigits(form.value[ck.socialSecurityNumber])
  if (ssnEditing.value) {
    return digits
  }

  return digits.length ? formatSsnMasked(digits) : ''
})

watch(
  () => props.modelValue,
  open => {
    if (open) {
      resetForm()
      successVisible.value = false
      markPristine()
    }
  },
)

function requiredLabel(text) {
  return `${text} *`
}

function onSsnFocus() {
  ssnEditing.value = true
}

function onSsnInput(val) {
  form.value[ck.socialSecurityNumber] = normalizeSsnDigits(val)
}

function onSsnBlur() {
  ssnEditing.value = false
  form.value[ck.socialSecurityNumber] = normalizeSsnDigits(
    form.value[ck.socialSecurityNumber],
  )
}

async function onNext() {
  if (activeTab.value === addClientTabKeys.basic) {
    const ok = await validateBasicTab()
    if (!ok) {
      return
    }
  }
  goNextTab()
}

async function onSave() {
  const ok = await validateBasicTab()
  if (!ok) {
    activeTab.value = addClientTabKeys.basic

    return
  }

  saving.value = true
  successVisible.value = false
  try {
    await siteStore.createClient(form.value, t)
    successVisible.value = true
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clientSavedSuccess'),
      position: 'top',
    })
    emit('saved')
    markPristine()
    setTimeout(() => {
      emit('update:modelValue', false)
    }, 1200)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const msg = error?.response?.data?.message
        || error?.message
        || t('clientSaveError')
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: String(msg),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
  }
}

function onClose() {
  if (isDirty()) {
    cancelConfirmOpen.value = true

    return
  }
  emit('update:modelValue', false)
}

function confirmClose() {
  cancelConfirmOpen.value = false
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.add-client-card {
  background: $page-bg;
  max-height: calc(100vh - 48px);
  border-radius: $radius-lg !important;
  overflow: auto;
}

.add-client-tabs {
  :deep(.q-tab) {
    border-radius: $radius-md;
    margin-right: 8px;
    min-height: 40px;
    padding: 0 20px;
    font-weight: 600;
    color: $primary;
    background: rgba($primary, 0.12);
  }

  :deep(.q-tab--active) {
    background: $primary;
    color: $white;
  }
}

.client-number-badge {
  background: $surface-muted;
  border-radius: $radius-md;
}
</style>
