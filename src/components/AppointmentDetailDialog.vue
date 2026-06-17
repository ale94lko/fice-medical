<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onClose">
        {{ t('appointmentDetailTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('appointmentColNumber') }}
            </p>
            <p class="text-body1">{{ record?.appointmentNumber || '—' }}</p>
          </div>
          <div class="col-12 col-md-6">
            <p class="text-caption text-grey-7 q-mb-xs">{{ t('status') }}</p>
            <p class="text-body1">{{ statusLabel(record?.status) }}</p>
          </div>
          <div class="col-12 col-md-6">
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('appointmentColType') }}
            </p>
            <p class="text-body1">{{ record?.appointmentTypeName || '—' }}</p>
          </div>
          <div class="col-12 col-md-6">
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('appointmentColClinician') }}
            </p>
            <p class="text-body1">
              {{ record?.clinicianDisplayName || '—' }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('appointmentColDateTime') }}
            </p>
            <p class="text-body1">{{ dateTimeLabel }}</p>
          </div>
          <div class="col-12 col-md-6">
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('appointmentColTelemedicine') }}
            </p>
            <p class="text-body1">
              {{ record?.telemedicine ? t('yes') : t('no') }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('appointmentColReferral') }}
            </p>
            <p class="text-body1">{{ record?.referralLabel || '—' }}</p>
          </div>
          <div class="col-12">
            <p class="text-caption text-grey-7 q-mb-xs">
              {{ t('appointmentNotesOptional') }}
            </p>
            <p class="text-body1">{{ record?.notes || '—' }}</p>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('close')"
          @click="onClose"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
} from 'src/utils/appointment-datetime.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const dateTimeLabel = computed(() => {
  const date = formatUtcDateLong(props.record?.startAtUtc)
  const time = formatUtcTimeRange(
    props.record?.startAtUtc,
    props.record?.endAtUtc,
  )
  if (!date) {
    return '—'
  }

  return time ? `${date} — ${time}` : date
})

function statusLabel(status) {
  const key = `appointmentStatus${String(status ?? '')
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join('')}`

  return t(key)
}

function onClose() {
  open.value = false
}
</script>
