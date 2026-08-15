<template>
  <div class="insurance-dialog__card-section q-mt-lg">
    <SubsectionHeading
      icon="post_add"
      :title="t('clinicalNoteAddendaTitle')"
    />
    <p class="text-body2 text-grey-7 q-mt-sm q-mb-none">
      {{ t('clinicalNoteAddendaHint') }}
    </p>

    <div
      v-if="!addenda.length"
      class="text-body2 text-grey-7 q-mt-md">
      {{ t('clinicalNoteAddendaEmpty') }}
    </div>

    <div
      v-for="(item, index) in addenda"
      :key="item.id || index"
      class="clinical-note-addendum q-mt-md"
      :data-testid="tid.addendumItem(item.id)">
      <p class="text-subtitle2 q-mb-xs">
        {{ addendumHeading(index) }}
      </p>
      <p class="text-caption text-grey-7 q-mb-sm">
        {{ clinicianLabel(item) }}
      </p>
      <p class="text-body2 q-mb-sm clinical-note-addendum__body">
        {{ item.body || '—' }}
      </p>
      <SignatureCanvas
        v-if="item.signatureData"
        :model-value="item.signatureData"
        readonly
      />
      <p
        v-if="item.signedAt"
        class="text-caption text-grey-7 q-mt-sm q-mb-none">
        {{ t('clinicalNoteAddendumSignedAt', {
          date: formatSignedDate(item.signedAt),
        }) }}
      </p>
    </div>

    <q-btn
      v-if="canAdd"
      no-caps
      outline
      color="primary"
      class="app-btn-outline q-mt-md"
      icon="post_add"
      :disable="adding"
      :data-testid="tid.btn('add-addendum')"
      :label="t('clinicalNoteAddAddendum')"
      @click="emit('add')"
    />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import SignatureCanvas from 'components/SignatureCanvas.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import { clinicalNoteTestIds as tid } from 'src/test-ids/index.js'
import { formatClinicianDisplayLabel } from
  'src/utils/clinician-display.js'

defineProps({
  addenda: {
    type: Array,
    default: () => [],
  },
  canAdd: {
    type: Boolean,
    default: false,
  },
  adding: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['add'])
const { t } = useI18n()

function formatSignedDate(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return '—'
  }
  const date = new Date(raw)

  return Number.isNaN(date.getTime())
    ? raw
    : date.toLocaleString()
}

function clinicianLabel(item) {
  const formatted = formatClinicianDisplayLabel(item?.clinician)
  if (formatted) {
    return formatted
  }
  if (item?.clinicianLabel) {
    return item.clinicianLabel
  }
  if (item?.clinicianId != null) {
    return `Clinician #${item.clinicianId}`
  }

  return '—'
}

function addendumHeading(index) {
  return t('clinicalNoteAddendumItemTitle', {
    n: index + 1,
  })
}
</script>

<style lang="scss" scoped>
.clinical-note-addendum__body {
  white-space: pre-wrap;
}
</style>
