<template>
  <div class="client-overview-clinicians">
    <div
      v-if="clinicians.length"
      class="client-overview-clinicians__cards">
      <article
        v-for="clinician in clinicians"
        :key="clinician.id ?? clinician.name"
        class="client-overview-clinicians__card">
        <q-icon
          v-if="clinician.isPrimary"
          name="star"
          size="14px"
          class="client-overview-clinicians__star"
        />
        <div
          class="client-overview-clinicians__avatar"
          :style="clinician.avatarStyle">
          {{ clinician.initials }}
        </div>
        <div class="client-overview-clinicians__card-body col">
          <p class="client-overview-clinicians__name q-mb-none">
            {{ clinician.name }}
          </p>
          <p
            v-if="clinician.specialty"
            class="client-overview-clinicians__specialty q-mb-none">
            {{ clinician.specialty }}
          </p>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
defineProps({
  clinicians: {
    type: Array,
    default: () => [],
  },
})
</script>
