<template>
  <section
    class="client-overview-alt-panel"
    :data-testid="clientOverviewAltTestIds.insurance">
    <SectionHeading
      icon="health_and_safety"
      :title="t('tabInsurance')"
    />

    <p
      v-if="!profiles.length"
      class="client-overview-alt-panel__empty">
      {{ emptyLabel }}
    </p>

    <div
      v-else
      class="client-overview-alt-panel__cards">
      <article
        v-for="profile in profiles"
        :key="profile.key"
        class="client-overview-alt-panel__card">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <p class="client-overview-alt-panel__label">
              {{ t('insurancePayerPlan') }}
            </p>
            <p class="client-overview-alt-panel__value">
              {{ profile.payerName }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="client-overview-alt-panel__label">
              {{ t('insuranceMemberId') }}
            </p>
            <p class="client-overview-alt-panel__value">
              {{ profile.memberId }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="client-overview-alt-panel__label">
              {{ t('status') }}
            </p>
            <p class="client-overview-alt-panel__value">
              {{ profile.status }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="client-overview-alt-panel__label">
              {{ t('insurancePriority') }}
            </p>
            <p class="client-overview-alt-panel__value">
              {{ profile.priority }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="client-overview-alt-panel__label">
              {{ t('insuranceType') }}
            </p>
            <p class="client-overview-alt-panel__value">
              {{ profile.insuranceType }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="client-overview-alt-panel__label">
              {{ t('insuranceEffectiveDate') }}
            </p>
            <p class="client-overview-alt-panel__value">
              {{ profile.effective }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="client-overview-alt-panel__label">
              {{ t('insuranceExpirationDate') }}
            </p>
            <p class="client-overview-alt-panel__value">
              {{ profile.expiration }}
            </p>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionHeading from 'components/SectionHeading.vue'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  insuranceInfo: {
    type: Object,
    default: null,
  },
})

const { t } = useI18n()
const profiles = computed(() => props.insuranceInfo?.profiles ?? [])
const emptyLabel = computed(() =>
  props.insuranceInfo?.emptyLabel || t('insuranceProfilesEmpty'),
)
</script>
