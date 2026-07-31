<template>
  <DashboardWidgetShell
    :title="title"
    :description="description"
    :icon="icon"
    :tone="tone"
    coming-soon
    :coming-soon-label="comingSoonLabel"
    :test-id="testId">
    <p class="dashboard-coming-soon__message q-mb-none">
      {{ message }}
    </p>
  </DashboardWidgetShell>
</template>

<script setup>
import DashboardWidgetShell from 'components/dashboard/DashboardWidgetShell.vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'schedule',
  },
  tone: {
    type: String,
    default: 'orange',
  },
  comingSoonLabel: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  testId: {
    type: String,
    default: '',
  },
})
</script>
