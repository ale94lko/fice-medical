<template>
  <div
    v-if="isMobile"
    class="admin-data-table client-overview-module-card-grid"
    :class="[
      cardClass,
      `client-overview-module-card--tone-${resolvedTone}`,
    ]"
    :data-testid="testId">
    <div class="admin-table-grid-item">
      <q-card
        flat
        bordered
        class="admin-table-grid-card admin-table-grid-card--compact">
        <div class="admin-table-grid-card__header">
          <DataItemComponent
            class="admin-table-grid-card__data-item"
            :icon="icon"
            icon-style="neutral"
            icon-size="44px"
            title-size="medium"
            :title="title"
            :clickable="false">
            <template
              v-if="showCount"
              #actions>
              <span class="client-overview-module-card__count">
                {{ count }}
              </span>
            </template>
          </DataItemComponent>
        </div>

        <div class="admin-table-grid-card__body">
          <template v-if="items.length">
            <div
              v-for="(item, index) in items"
              :key="`${moduleId}-${index}`"
              class="admin-table-grid-card__field-row">
              <div class="admin-table-grid-card__field-label">
                <span>{{ item.label }}</span>
                <span
                  v-if="isAllergyModule && item.year"
                  class="client-overview-module-card__item-year">
                  {{ item.year }}
                </span>
              </div>
              <div class="admin-table-grid-card__field-value">
                <span
                  v-if="item.severityModifier"
                  :class="[
                    'allergy-severity-badge',
                    allergySeverityBadgeClass(item.severityModifier),
                  ]">
                  {{ item.severityLabel }}
                </span>
                <span
                  v-else-if="item.meta"
                  class="client-overview-module-card__item-meta">
                  {{ item.meta }}
                </span>
                <span v-else>—</span>
              </div>
            </div>
          </template>
          <p
            v-else
            class="client-overview-module-card__empty text-grey-7
              q-mb-none">
            {{ emptyLabel }}
          </p>
        </div>

        <div class="admin-table-grid-card__footer">
          <button
            type="button"
            class="client-overview-module-card__view-all"
            :disabled="comingSoon"
            @click="emit('view-all')">
            <span>{{ viewAllLabel }}</span>
            <q-icon name="arrow_forward" size="16px" />
          </button>
        </div>
      </q-card>
    </div>
  </div>

  <article
    v-else
    class="client-overview-module-card"
    :class="[
      cardClass,
      `client-overview-module-card--tone-${resolvedTone}`,
    ]"
    :data-testid="testId">
    <header class="client-overview-module-card__header row items-center
      no-wrap">
      <div
        class="client-overview-module-card__icon"
        :class="`client-overview-module-card__icon--${resolvedTone}`">
        <q-icon :name="icon" size="18px" />
      </div>
      <h3 class="client-overview-module-card__title col q-mb-none">
        {{ title }}
      </h3>
      <span
        v-if="showCount"
        class="client-overview-module-card__count">
        {{ count }}
      </span>
    </header>

    <ul class="client-overview-module-card__list q-pl-none q-mb-md">
      <li
        v-for="(item, index) in items"
        :key="`${moduleId}-${index}`"
        class="client-overview-module-card__list-item"
        :class="{
          'client-overview-module-card__list-item--allergy':
            isAllergyModule,
        }">
        <template v-if="isAllergyModule">
          <div class="client-overview-module-card__allergy-main col">
            <span
              class="client-overview-module-card__item-label"
              :title="item.label">
              {{ item.label }}
            </span>
            <span
              v-if="item.year"
              class="client-overview-module-card__item-year">
              {{ item.year }}
            </span>
          </div>
          <span
            v-if="item.severityModifier"
            :class="[
              'allergy-severity-badge',
              'client-overview-module-card__severity',
              allergySeverityBadgeClass(item.severityModifier),
            ]">
            {{ item.severityLabel }}
          </span>
        </template>
        <template v-else>
          <span
            v-if="item.severityModifier"
            :class="[
              'allergy-severity-badge',
              'client-overview-module-card__severity',
              allergySeverityBadgeClass(item.severityModifier),
            ]">
            {{ item.severityLabel }}
          </span>
          <span
            class="client-overview-module-card__item-label col"
            :title="item.label">
            {{ item.label }}
          </span>
          <span
            v-if="item.meta && !item.severityModifier"
            class="client-overview-module-card__item-meta"
            :title="item.meta">
            {{ item.meta }}
          </span>
        </template>
      </li>
      <li
        v-if="!items.length"
        class="client-overview-module-card__empty text-grey-7">
        {{ emptyLabel }}
      </li>
    </ul>

    <button
      type="button"
      class="client-overview-module-card__view-all"
      :disabled="comingSoon"
      @click="emit('view-all')">
      <span>{{ viewAllLabel }}</span>
      <q-icon name="arrow_forward" size="16px" />
    </button>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DataItemComponent from 'components/template/DataItemComponent.vue'
import { useViewportLayout } from 'src/composables/useViewportLayout.js'
import {
  clientListAllergySeverityBadgeClass as allergySeverityBadgeClass,
} from 'src/utils/client-list-allergy-severity.js'
import { clientOverviewTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  moduleId: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  tone: {
    type: String,
    default: 'slate',
  },
  title: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  items: {
    type: Array,
    default: () => [],
  },
  comingSoon: {
    type: Boolean,
    default: false,
  },
  cardSeverityModifier: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['view-all'])

const { t } = useI18n()
const { isMobile } = useViewportLayout()

const showCount = computed(() => !props.comingSoon)
const isAllergyModule = computed(() => props.moduleId === 'allergies')
const emptyLabel = computed(() => t('clientOverviewModuleEmpty'))
const viewAllLabel = computed(() =>
  props.comingSoon
    ? t('tabComingSoon')
    : t('clientOverviewViewAllModule', { module: props.title }),
)
const testId = computed(
  () => clientOverviewTestIds.moduleCard(props.moduleId),
)

const cardClass = computed(() => {
  const modifier = trim(props.cardSeverityModifier)
  if (!modifier) {
    return null
  }

  return `client-overview-module-card--allergy-${modifier}`
})

const resolvedTone = computed(() => {
  const modifier = trim(props.cardSeverityModifier)
  if (modifier === 'severe') {
    return 'red'
  }
  if (modifier === 'moderate') {
    return 'orange'
  }
  if (modifier === 'mild') {
    return 'yellow'
  }
  if (modifier === 'nka') {
    return 'green'
  }

  return props.tone
})

function trim(value) {
  return String(value ?? '').trim()
}
</script>
