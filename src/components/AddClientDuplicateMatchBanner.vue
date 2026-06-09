<template>
  <div
    v-if="visible"
    class="add-client-duplicate-banner"
    :class="{ 'add-client-duplicate-banner--in-header': inPageHeader }"
    :data-testid="tid.banner">
    <div class="add-client-duplicate-banner__row row items-start no-wrap">
      <q-icon
        name="warning"
        color="warning"
        size="22px"
        class="add-client-duplicate-banner__icon q-mr-sm"
      />
      <div class="col">
        <div class="add-client-duplicate-banner__title text-weight-bold">
          {{ t('duplicateMatchBannerTitle', { count: matches.length }) }}
        </div>
        <div class="add-client-duplicate-banner__hint text-body2 text-grey-7">
          {{ t('duplicateMatchBannerHint') }}
        </div>
      </div>
      <div
        class="add-client-duplicate-banner__actions row items-center no-wrap
          q-gutter-sm">
        <q-btn
          no-caps
          unelevated
          class="add-client-duplicate-banner__action-btn"
          :data-testid="tid.btnIgnore"
          :label="t('duplicateMatchIgnore')"
          @click="emit('ignore')"
        />
        <q-btn
          no-caps
          unelevated
          class="add-client-duplicate-banner__action-btn
            add-client-duplicate-banner__toggle"
          :data-testid="tid.btnViewMatches"
          icon-right="expand_more"
          :label="t('duplicateMatchViewMatches')">
          <q-menu
            v-model="menuOpen"
            anchor="bottom end"
            self="top end"
            class="add-client-duplicate-banner__menu"
            @hide="menuShowAll = false">
            <q-card flat class="add-client-duplicate-banner__menu-card">
              <q-card-section class="q-py-sm q-px-md">
                <div class="text-subtitle2 text-weight-bold text-grey-9">
                  {{ t('duplicateMatchMenuTitle') }}
                </div>
              </q-card-section>
              <q-separator />
              <q-list
                dense
                separator
                class="add-client-duplicate-banner__list"
                :style="{ maxHeight: menuListMaxHeight }">
                <q-item
                  v-for="m in displayedMatches"
                  :key="m.patientId"
                  clickable
                  v-ripple
                  class="add-client-duplicate-banner__item"
                  :data-testid="tid.row(m.patientId)"
                  @click="onPickMatch(m)">
                  <q-item-section avatar>
                    <q-avatar
                      icon="person"
                      color="grey-4"
                      text-color="grey-8"
                      size="32px"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ m.fullName }}
                    </q-item-label>
                    <q-item-label caption class="text-grey-7">
                      {{ dobLabel(m.dateOfBirth) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section
                    side
                    class="add-client-duplicate-banner__score">
                    <span class="text-body2 text-weight-medium">
                      {{ Math.round(Number(m.matchScore) || 0) }}%
                    </span>
                    <span class="text-caption text-grey-7 block">
                      {{ confidenceLabel(m.matchConfidence) }}
                    </span>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="chevron_right" color="grey-6" />
                  </q-item-section>
                </q-item>
              </q-list>
              <template
                v-if="hasMoreMatchesThanPreview && !menuShowAll">
                <q-separator />
                <q-card-actions align="center" class="q-py-sm">
                  <q-btn
                    flat
                    no-caps
                    dense
                    color="primary"
                    :data-testid="tid.btnViewAll"
                    :label="t('duplicateMatchViewAll')"
                    @click="menuShowAll = true"
                  />
                </q-card-actions>
              </template>
            </q-card>
          </q-menu>
        </q-btn>
      </div>
    </div>
    <q-inner-loading :showing="loading" color="warning" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { isoDateToUsDateString } from 'src/utils/client-form.js'
import { addClientTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  matches: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  ignored: {
    type: Boolean,
    default: false,
  },
  /** When true, no outer margin (banner sits in page header row). */
  inPageHeader: {
    type: Boolean,
    default: false,
  },
  menuPreviewLimit: {
    type: Number,
    default: 4,
  },
})

const emit = defineEmits(['review', 'ignore'])

const { t } = useI18n()
const tid = addClientTestIds.duplicateMatch
const menuOpen = ref(false)
const menuShowAll = ref(false)

const visible = computed(
  () => !props.ignored && props.matches.length > 0,
)

const displayedMatches = computed(() => {
  if (menuShowAll.value) {
    return props.matches
  }

  return props.matches.slice(0, props.menuPreviewLimit)
})

const hasMoreMatchesThanPreview = computed(
  () => props.matches.length > props.menuPreviewLimit,
)

const menuListMaxHeight = computed(() =>
  menuShowAll.value ? 'min(70vh, 520px)' : '280px',
)

function onPickMatch(match) {
  menuOpen.value = false
  emit('review', match)
}

function dobLabel(isoOrEmpty) {
  const raw = String(isoOrEmpty ?? '').trim()
  if (!raw) {
    return t('duplicateMatchDobUnknown')
  }
  const us = isoDateToUsDateString(raw)

  return us ? `${t('dob')}: ${us}` : `${t('dob')}: ${raw}`
}

function confidenceLabel(confidence) {
  const u = String(confidence ?? '').trim().toUpperCase().replace(/\s+/g, '_')
  if (u === 'HIGH' || u === 'ALTA') {
    return t('duplicateMatchConfidenceHigh')
  }
  if (u === 'MEDIUM' || u === 'MEDIA') {
    return t('duplicateMatchConfidenceMedium')
  }
  if (u === 'LOW' || u === 'BAJA') {
    return t('duplicateMatchConfidenceLow')
  }

  return t('duplicateMatchConfidenceUnknown')
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@import 'src/css/quasar.variables';

.add-client-duplicate-banner {
  position: relative;
  border: 1px solid color.adjust($warning, $alpha: -0.55);
  border-radius: $radius-md;
  background: color.adjust($warning, $alpha: -0.88);
  padding: 12px 14px;
  margin-bottom: 12px;
}

.add-client-duplicate-banner--in-header {
  margin-bottom: 0;
}

$dup-banner-btn-bg: #fff8e6;
$dup-banner-btn-border: #f0c75e;
$dup-banner-btn-text: #7c6a35;
$dup-banner-btn-icon: #b7791f;

.add-client-duplicate-banner__title {
  font-size: 0.9375rem;
  color: $text-strong;
}

.add-client-duplicate-banner__action-btn {
  background: $dup-banner-btn-bg !important;
  border: 1px solid $dup-banner-btn-border !important;
  border-radius: $radius-md !important;
  color: $dup-banner-btn-text !important;
  box-shadow: none !important;

  :deep(.q-btn__wrapper) {
    padding: 6px 14px;
    min-height: 36px;
    border-radius: inherit;
  }

  :deep(.q-icon) {
    color: $dup-banner-btn-icon !important;
  }

  :deep(.q-btn__content) {
    color: $dup-banner-btn-text !important;
  }
}

.add-client-duplicate-banner__list {
  background: $surface;
}

.add-client-duplicate-banner__menu-card .add-client-duplicate-banner__list {
  border: none;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.add-client-duplicate-banner__item {
  min-height: 52px;
}

.add-client-duplicate-banner__score {
  text-align: right;
}

.add-client-duplicate-banner__actions {
  flex-shrink: 0;
  align-self: flex-start;
  padding-top: 2px;
}

.add-client-duplicate-banner__menu-card {
  min-width: 300px;
  max-width: min(100vw - 24px, 400px);
}
</style>
