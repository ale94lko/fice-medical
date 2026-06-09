<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    :data-testid="reviewDialogTestId"
    @update:model-value="v => emit('update:modelValue', v)">
    <q-card
      class="insurance-dialog app-dialog-card duplicate-match-review__card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('duplicateMatchReviewTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('duplicateMatchReviewSubtitle', {
            name: selectedMatch?.fullName ?? '',
            score: Math.round(Number(selectedMatch?.matchScore) || 0),
          }) }}
        </p>
        <q-inner-loading :showing="loading" color="primary">
          <q-spinner size="40px" />
        </q-inner-loading>
        <div
          v-if="!loading && previewForm"
          class="duplicate-match-review__sections">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">
            {{ t('personalInformation') }}
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <FormField :label="t('firstName')" spaced>
                <div class="text-body1">
                  {{ display(previewForm[ck.firstName]) }}
                </div>
              </FormField>
            </div>
            <div class="col-12 col-md-6">
              <FormField :label="t('middleName')" spaced>
                <div class="text-body1">
                  {{ display(previewForm[ck.middleName]) }}
                </div>
              </FormField>
            </div>
            <div class="col-12 col-md-6">
              <FormField :label="t('lastName')" spaced>
                <div class="text-body1">
                  {{ display(previewForm[ck.lastName]) }}
                </div>
              </FormField>
            </div>
            <div class="col-12 col-md-6">
              <FormField :label="t('dob')" spaced>
                <div class="text-body1">
                  {{ display(previewForm[ck.dob]) }}
                </div>
              </FormField>
            </div>
          </div>
          <div class="text-subtitle2 text-weight-bold q-mt-lg q-mb-sm">
            {{ t('tabContact') }}
          </div>
          <FormField :label="t('addressLine1')" spaced>
            <div class="text-body1">{{ display(contact.addressLine1) }}</div>
          </FormField>
          <FormField
            v-if="trim(contact.addressLine2)"
            :label="t('addressLine2')"
            spaced>
            <div class="text-body1">{{ display(contact.addressLine2) }}</div>
          </FormField>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <FormField :label="t('city')" spaced>
                <div class="text-body1">{{ display(contact.city) }}</div>
              </FormField>
            </div>
            <div class="col-12 col-md-4">
              <FormField :label="t('state')" spaced>
                <div class="text-body1">{{ display(contact.state) }}</div>
              </FormField>
            </div>
            <div class="col-12 col-md-4">
              <FormField :label="t('zipCode')" spaced>
                <div class="text-body1">{{ display(contact.zipCode) }}</div>
              </FormField>
            </div>
          </div>
          <FormField :label="t('duplicateMatchContactPhones')" spaced>
            <ul class="q-pl-md q-my-none">
              <li
                v-for="(p, idx) in phonesDisplay"
                :key="`ph-${idx}`"
                class="text-body1">
                {{ p }}
              </li>
            </ul>
            <div
              v-if="!phonesDisplay.length"
              class="text-body2 text-grey-6">
              {{ t('duplicateMatchNoPhones') }}
            </div>
          </FormField>
          <FormField :label="t('duplicateMatchContactEmails')" spaced>
            <ul class="q-pl-md q-my-none">
              <li
                v-for="(e, idx) in emailsDisplay"
                :key="`em-${idx}`"
                class="text-body1">
                {{ e }}
              </li>
            </ul>
            <div
              v-if="!emailsDisplay.length"
              class="text-body2 text-grey-6">
              {{ t('duplicateMatchNoEmails') }}
            </div>
          </FormField>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions duplicate-match-review__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="modalTestIds.cancel('duplicate-match-review')"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="tid.btnNotMatch"
          :label="t('duplicateMatchNotMatch')"
          @click="onNotMatch"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="tid.btnOpenExisting"
          :label="t('duplicateMatchOpenExisting')"
          @click="emit('open-existing')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormField from 'components/FormField.vue'
import {
  clientFieldKeys as ck,
  clientFormSections,
} from 'components/constants.js'
import { modalTestIds } from 'src/test-ids/index.js'
import { addClientTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  previewForm: { type: Object, default: null },
  selectedMatch: { type: Object, default: null },
})

const emit = defineEmits([
  'update:modelValue',
  'cancel',
  'not-match',
  'open-existing',
])

const { t } = useI18n()
const tid = addClientTestIds.duplicateMatch

const reviewDialogTestId = modalTestIds.dialog('duplicate-match-review')

const contact = computed(() => {
  const c = props.previewForm?.[clientFormSections.contact]
  if (!c || typeof c !== 'object') {
    return {}
  }

  return c
})

const phonesDisplay = computed(() => {
  const rows = contact.value?.phones ?? []

  return rows
    .map(p => {
      const n = trim(p?.number)
      const ty = trim(p?.type)

      return n ? (ty ? `${n} (${ty})` : n) : ''
    })
    .filter(Boolean)
})

const emailsDisplay = computed(() => {
  const rows = contact.value?.emails ?? []

  return rows
    .map(e => {
      const a = trim(e?.address)
      const ty = trim(e?.type)

      return a ? (ty ? `${a} (${ty})` : a) : ''
    })
    .filter(Boolean)
})

function trim(value) {
  return String(value ?? '').trim()
}

function display(value) {
  const s = trim(value)

  return s || '—'
}

function onCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function onNotMatch() {
  emit('not-match')
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.duplicate-match-review__card {
  min-width: 360px;
  max-width: 560px;
}

.duplicate-match-review__actions {
  flex-wrap: wrap;
  gap: 8px;
}
</style>
