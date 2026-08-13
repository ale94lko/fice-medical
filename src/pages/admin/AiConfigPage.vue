<template>
  <q-page
    class="admin-page ai-config-page"
    :data-testid="aiTestIds.configPage">
    <AppLoadingOverlay scope="content" :showing="loading" />

    <AdminListPageHeader
      :title="t('aiConfigTitle')"
      :subtitle="t('aiConfigSubtitle')"
    />

    <div
      v-if="config"
      class="ai-config-page__card fmh-list-card q-pa-lg q-mt-md">
      <p class="text-body2 text-grey-7 q-mb-md">
        {{ t('aiSuggestionFraming') }}
      </p>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <FormField :label="t('aiConfigEnabled')">
            <div class="text-body1">
              {{ config.enabled ? t('yes') : t('no') }}
            </div>
          </FormField>
        </div>
        <div class="col-12 col-md-4">
          <FormField :label="t('aiConfigProvider')">
            <div class="text-body1">{{ config.provider || '—' }}</div>
          </FormField>
        </div>
        <div class="col-12 col-md-4">
          <FormField :label="t('aiConfigModel')">
            <div class="text-body1">{{ config.model || '—' }}</div>
          </FormField>
        </div>
      </div>

      <SectionHeading
        class="q-mt-lg"
        icon="tune"
        :title="t('aiConfigPromptVersions')"
      />
      <p class="text-body2 text-grey-7 q-mb-md">
        {{ t('aiConfigPromptVersionsHint') }}
      </p>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <FormField :label="t('aiPromptClinicalSoap')" spaced>
            <q-input
              v-model.number="draft.clinicalSoap"
              type="number"
              outlined
              dense
              min="1"
              :data-testid="aiTestIds.field('prompt-soap')"
            />
          </FormField>
        </div>
        <div class="col-12 col-md-6">
          <FormField :label="t('aiPromptIcd10')" spaced>
            <q-input
              v-model.number="draft.icd10Suggestion"
              type="number"
              outlined
              dense
              min="1"
              :data-testid="aiTestIds.field('prompt-icd10')"
            />
          </FormField>
        </div>
        <div class="col-12 col-md-6">
          <FormField :label="t('aiPromptClinicalSummary')" spaced>
            <q-input
              v-model.number="draft.clinicalSummary"
              type="number"
              outlined
              dense
              min="1"
              :data-testid="aiTestIds.field('prompt-clinical')"
            />
          </FormField>
        </div>
        <div class="col-12 col-md-6">
          <FormField :label="t('aiPromptCarePlan')" spaced>
            <q-input
              v-model.number="draft.carePlanDraft"
              type="number"
              outlined
              dense
              min="1"
              :data-testid="aiTestIds.field('prompt-care-plan')"
            />
          </FormField>
        </div>
      </div>

      <div class="row justify-end q-mt-lg">
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :disable="!dirty"
          :data-testid="aiTestIds.configSave"
          :label="t('save')"
          @click="onSave"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import FormField from 'components/FormField.vue'
import SectionHeading from 'components/SectionHeading.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { aiTestIds } from 'src/test-ids/ai.js'
import {
  aiApiErrorMessage,
  fetchAiConfig,
  patchAiConfig,
} from 'src/utils/ai-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'

const { t } = useI18n()
const $q = useQuasar()

const loading = ref(false)
const saving = ref(false)
const config = ref(null)
const draft = reactive({
  clinicalSoap: 1,
  icd10Suggestion: 1,
  clinicalSummary: 1,
  carePlanDraft: 1,
})

const dirty = computed(() => {
  const prompts = config.value?.prompts
  if (!prompts) {
    return false
  }

  return draft.clinicalSoap !== prompts.clinicalSoap
    || draft.icd10Suggestion !== prompts.icd10Suggestion
    || draft.clinicalSummary !== prompts.clinicalSummary
    || draft.carePlanDraft !== prompts.carePlanDraft
})

function applyDraft(prompts) {
  draft.clinicalSoap = prompts.clinicalSoap
  draft.icd10Suggestion = prompts.icd10Suggestion
  draft.clinicalSummary = prompts.clinicalSummary
  draft.carePlanDraft = prompts.carePlanDraft
}

async function loadConfig() {
  loading.value = true
  try {
    config.value = await fetchAiConfig()
    applyDraft(config.value.prompts)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: aiApiErrorMessage(error, t('aiConfigLoadError')),
      })
    }
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  try {
    config.value = await patchAiConfig({ ...draft })
    applyDraft(config.value.prompts)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('aiConfigSaved'),
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: aiApiErrorMessage(error, t('aiConfigSaveError')),
      })
    }
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>
