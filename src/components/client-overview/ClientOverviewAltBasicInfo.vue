<template>
  <section
    class="client-overview-alt-basic"
    :data-testid="clientOverviewAltTestIds.basicInfo">
    <SectionHeading
      icon="badge"
      :title="t('tabBasicInformation')"
    />

    <div class="row q-col-gutter-md">
      <div
        v-for="item in fields"
        :key="item.key"
        class="col-12"
        :class="item.type === 'clinicians' ? 'col-md-12' : 'col-md-6'">
        <p class="client-overview-alt-basic__label">
          {{ item.label }}
        </p>
        <div
          v-if="item.type === 'phones' || item.type === 'emails'"
          class="client-overview-alt-basic__contact">
          <AdminTableContactOverflow
            v-if="item.entries?.length"
            :entries="item.entries"
            :icon="item.type === 'phones' ? 'phone' : 'mail_outline'"
            variant="header"
          />
          <p
            v-else
            class="client-overview-alt-basic__value">
            —
          </p>
        </div>
        <div
          v-else-if="item.type === 'clinicians'"
          class="client-overview-alt-basic__clinicians">
          <AdminTableClinicianAvatars
            v-if="item.clinicians?.length"
            :entries="item.clinicians"
            size="md"
          />
          <p
            v-else
            class="client-overview-alt-basic__value">
            —
          </p>
        </div>
        <p
          v-else
          class="client-overview-alt-basic__value">
          {{ item.value }}
        </p>
      </div>
    </div>

    <footer class="client-overview-alt-basic__footer">
      <div class="client-overview-alt-basic__footer-item">
        <q-icon name="event" size="16px" />
        <div>
          <span class="client-overview-alt-basic__footer-label">
            {{ t('clientOverviewAltCreated') }}
          </span>
          <span class="client-overview-alt-basic__footer-value">
            {{ footer.created }}
          </span>
        </div>
      </div>
      <div class="client-overview-alt-basic__footer-item">
        <q-icon name="schedule" size="16px" />
        <div>
          <span class="client-overview-alt-basic__footer-label">
            {{ t('clientOverviewAltLastUpdated') }}
          </span>
          <span class="client-overview-alt-basic__footer-value">
            {{ footer.lastUpdated }}
          </span>
        </div>
      </div>
      <div class="client-overview-alt-basic__footer-item">
        <span class="client-overview-alt-basic__footer-label">
          {{ t('clientOverviewAltRecordStatus') }}
        </span>
        <span
          class="client-overview-alt-basic__status"
          :class="statusClass(footer.recordStatus)">
          {{ footer.recordStatusLabel }}
        </span>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionHeading from 'components/SectionHeading.vue'
import AdminTableClinicianAvatars from
  'components/admin-table/AdminTableClinicianAvatars.vue'
import AdminTableContactOverflow from
  'components/admin-table/AdminTableContactOverflow.vue'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  basicInfo: {
    type: Object,
    default: null,
  },
})

const { t } = useI18n()

const fields = computed(() => [
  ...(props.basicInfo?.personal ?? []),
  ...(props.basicInfo?.administrative ?? []),
])

const footer = computed(() => props.basicInfo?.footer ?? {
  created: '—',
  lastUpdated: '—',
  recordStatusLabel: '—',
  recordStatus: 'active',
})

function statusClass(status) {
  const key = String(status ?? '').trim().toLowerCase()
  if (key === 'inactive' || key === 'discharged' || key === 'closed') {
    return 'client-overview-alt-basic__status--inactive'
  }

  return 'client-overview-alt-basic__status--active'
}
</script>
