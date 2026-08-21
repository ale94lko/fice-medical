<template>
  <article
    class="clinic-messages-client__appt"
    :data-testid="clinicMessagesTestIds.appointment(row.id)"
  >
    <div
      v-if="row.month && row.day"
      class="clinic-messages-client__appt-date"
    >
      <span>{{ row.month }}</span>
      <strong>{{ row.day }}</strong>
    </div>
    <div class="clinic-messages-client__appt-body">
      <div
        v-if="row.time"
        class="clinic-messages-client__appt-when"
      >
        <q-icon
          name="domain"
          size="16px"
        />
        <span>{{ row.time }}</span>
      </div>
      <p
        v-if="detailLine"
        class="clinic-messages-client__line"
      >
        {{ detailLine }}
      </p>
      <div
        v-if="row.status || row.telehealth"
        class="clinic-messages-client__appt-meta"
      >
        <q-badge
          v-if="row.status"
          outline
          color="primary"
          :label="row.status"
        />
        <span
          v-if="row.telehealth"
          class="clinic-messages-client__hint"
        >
          {{ t('placeOfServiceTelehealth') }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { clinicMessagesTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  row: { type: Object, required: true },
})

const { t } = useI18n()

const detailLine = computed(() => {
  const clinician = String(props.row?.clinician ?? '').trim()
  const service = String(props.row?.service ?? '').trim()
  if (clinician && service) {
    return `${clinician} - ${service}`
  }

  return clinician || service
})
</script>
