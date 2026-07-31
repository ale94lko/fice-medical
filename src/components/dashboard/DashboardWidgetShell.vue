<template>
  <article
    class="dashboard-widget"
    :class="[
      `dashboard-widget--${tone}`,
      {
        'dashboard-widget--clickable': Boolean(deepLinkTarget),
        'dashboard-widget--coming-soon': comingSoon,
      },
    ]"
    :data-testid="testId"
    :role="deepLinkTarget ? 'button' : undefined"
    :tabindex="deepLinkTarget ? 0 : undefined"
    @click="onActivate"
    @keydown.enter.prevent="onActivate"
    @keydown.space.prevent="onActivate">
    <header class="dashboard-widget__header row items-start no-wrap">
      <div class="dashboard-widget__heading col">
        <div class="row items-center q-gutter-xs no-wrap">
          <h2 class="dashboard-widget__title q-mb-none">
            {{ title }}
          </h2>
          <q-badge
            v-if="comingSoon"
            color="grey-6"
            outline
            class="dashboard-widget__badge">
            {{ comingSoonLabel }}
          </q-badge>
        </div>
        <p
          v-if="description"
          class="dashboard-widget__description q-mb-none">
          {{ description }}
        </p>
      </div>
      <div
        v-if="icon"
        class="dashboard-widget__icon"
        :class="`dashboard-widget__icon--${tone}`"
        aria-hidden="true">
        <q-icon :name="icon" size="18px" />
      </div>
    </header>

    <div class="dashboard-widget__body">
      <slot />
    </div>

    <footer
      v-if="footerLabel && !comingSoon"
      class="dashboard-widget__footer">
      <span>{{ footerLabel }}</span>
      <q-icon name="chevron_right" size="16px" />
    </footer>
  </article>
</template>

<script setup>
const props = defineProps({
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
    default: '',
  },
  tone: {
    type: String,
    default: 'blue',
  },
  comingSoon: {
    type: Boolean,
    default: false,
  },
  comingSoonLabel: {
    type: String,
    default: '',
  },
  footerLabel: {
    type: String,
    default: '',
  },
  deepLinkTarget: {
    type: [Object, String],
    default: null,
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['navigate'])

function onActivate() {
  if (!props.deepLinkTarget || props.comingSoon) {
    return
  }
  emit('navigate', props.deepLinkTarget)
}
</script>
