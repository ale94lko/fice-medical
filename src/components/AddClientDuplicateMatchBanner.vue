<template>
  <div
    v-if="visible"
    class="add-client-duplicate-banner"
    :class="{ 'add-client-duplicate-banner--in-header': inPageHeader }"
    :data-testid="tid.banner">
    <div class="add-client-duplicate-banner__row row items-start no-wrap">
      <q-icon
        name="warning"
        color="primary"
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
              <q-item
                v-ripple
                :class="[
                  'add-client-duplicate-banner__menu-header',
                ]">
                <q-item-section avatar>
                  <q-avatar
                    icon="person"
                    size="40px"
                    class="add-client-duplicate-banner__avatar"
                    :style="{
                      backgroundColor: 'var(--dup-avatar-bg)',
                      color: 'var(--dup-avatar-icon-color)',
                    }"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    class="add-client-duplicate-banner__full-name">
                    {{ t('duplicateMatchMenuTitle') }}
                  </q-item-label>
                  <q-item-label
                    caption
                    class="add-client-duplicate-banner__meta">
                    <span>
                      {{ t('duplicateMatchMenuSubtitle') }}
                    </span>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="add-client-duplicate-banner__menu-header-row
                    row items-start no-wrap">
                    <div class="add-client-duplicate-banner__menu-count-badge
                      row items-center no-wrap">
                      <q-icon
                        name="people"
                        size="18px"
                        class="add-client-duplicate-banner__menu-count-icon"
                      />
                      <span>
                        {{
                          t('duplicateMatchMatchesFound', {
                            count: matches.length,
                          })
                        }}
                      </span>
                    </div>
                  </div>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-list
                dense
                class="add-client-duplicate-banner__list"
                :style="{ maxHeight: menuListMaxHeight }">
                <q-item
                  v-for="m in displayedMatches"
                  :key="m.patientId"
                  clickable
                  v-ripple
                  :class="[
                    'add-client-duplicate-banner__item',
                    tierClass(m.matchConfidence),
                  ]"
                  :data-testid="tid.row(m.patientId)"
                  @click="onPickMatch(m)">
                  <q-item-section avatar>
                    <q-avatar
                      icon="person"
                      size="40px"
                      class="add-client-duplicate-banner__avatar"
                      :style="{
                        backgroundColor: 'var(--dup-avatar-bg)',
                        color: 'var(--dup-avatar-icon-color)',
                      }"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      class="add-client-duplicate-banner__full-name"
                    >
                      {{ displayMatchName(m.fullName) }}
                    </q-item-label>
                    <q-item-label
                      caption
                      class="add-client-duplicate-banner__meta"
                    >
                      <q-icon
                        name="event"
                        size="14px"
                        class="add-client-duplicate-banner__dob-icon"
                      />
                      <span>
                        {{ dobLabel(m.dateOfBirth) }}
                      </span>
                    </q-item-label>
                  </q-item-section>
                  <q-item-section
                    side
                    class="add-client-duplicate-banner__score">
                    <div class="add-client-duplicate-banner__badge">
                      <q-icon
                        :name="badgeIconForConfidence(m.matchConfidence)"
                        class="add-client-duplicate-banner__badge-icon"
                      />
                      <span class="add-client-duplicate-banner__badge-score">
                        {{ Math.round(Number(m.matchScore) || 0) }}%
                      </span>
                      <span class="add-client-duplicate-banner__badge-sep">
                        •
                      </span>
                      <span class="add-client-duplicate-banner__badge-term">
                        {{ badgeTermForConfidence(m.matchConfidence) }}
                      </span>
                    </div>
                    <div class="add-client-duplicate-banner__confidence-label">
                      <span class="add-client-duplicate-banner__status-dot" />
                      <span>
                        {{ confidenceLabel(m.matchConfidence) }}
                      </span>
                    </div>
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
    <q-inner-loading :showing="loading" color="primary" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { isoDateToUsDateString } from 'src/utils/client-form.js'
import { sortDuplicateMatches } from 'src/utils/client-duplicate-match-sort.js'
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
  const sorted = sortDuplicateMatches(props.matches)
  if (menuShowAll.value) {
    return sorted
  }

  return sorted.slice(0, props.menuPreviewLimit)
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

function tierClass(confidence) {
  const u = String(confidence ?? '').trim().toUpperCase().replace(/\s+/g, '_')
  if (u === 'HIGH' || u === 'ALTA') {
    return 'add-client-duplicate-banner__item--high'
  }
  if (u === 'MEDIUM' || u === 'MEDIA') {
    return 'add-client-duplicate-banner__item--medium'
  }
  if (u === 'LOW' || u === 'BAJA') {
    return 'add-client-duplicate-banner__item--low'
  }

  return 'add-client-duplicate-banner__item--unknown'
}

function badgeTermForConfidence(confidence) {
  const u = String(confidence ?? '').trim().toUpperCase().replace(/\s+/g, '_')
  if (u === 'HIGH' || u === 'ALTA') {
    return t('duplicateMatchBadgePotentialDuplicate')
  }
  if (u === 'MEDIUM' || u === 'MEDIA') {
    return t('duplicateMatchBadgePossibleMatch')
  }
  if (u === 'LOW' || u === 'BAJA') {
    return t('duplicateMatchBadgeLowConfidence')
  }

  return t('duplicateMatchConfidenceUnknown')
}

function badgeIconForConfidence(confidence) {
  const u = String(confidence ?? '').trim().toUpperCase().replace(/\s+/g, '_')
  if (u === 'HIGH' || u === 'ALTA') {
    return 'check_circle'
  }
  if (u === 'MEDIUM' || u === 'MEDIA') {
    return 'cloud'
  }
  if (u === 'LOW' || u === 'BAJA') {
    return 'warning'
  }

  return 'help'
}

function displayMatchName(rawName) {
  const name = String(rawName ?? '').trim()
  if (!name) {
    return ''
  }

  const prefixes = new Set([
    'DR',
    'MR',
    'MRS',
    'MS',
    'PROF',
    'REV',
    'FR',
    'FATHER',
    'MOTHER',
    'SISTER',
    'BROTHER',
  ])
  const suffixes = new Set([
    'JR',
    'SR',
    'II',
    'III',
    'IV',
    'V',
    'VI',
  ])

  const tokens = name
    .replace(/\s+/g, ' ')
    .replace(/[.,]+$/u, '')
    .split(' ')
    .filter(Boolean)

  // Strip suffix token (common generational markers).
  if (tokens.length > 1) {
    const last = tokens[tokens.length - 1].replace(/[.,]+$/u, '')
    if (suffixes.has(last.toUpperCase())) {
      tokens.pop()
    }
  }

  // Strip prefix token (title honorific).
  if (tokens.length > 1) {
    const first = tokens[0].replace(/[.,]+$/u, '')
    if (prefixes.has(first.toUpperCase())) {
      tokens.shift()
    }
  }

  return tokens.join(' ').trim()
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@import 'src/css/quasar.variables';

.add-client-duplicate-banner {
  position: relative;
  border-radius: $radius-md;
  background: #fff;
  padding: 12px 14px;
  margin-bottom: 12px;

  font-family: Inter, sans-serif;
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
  font-weight: 700;
  color: #111827;
}

.add-client-duplicate-banner__hint {
  color: #6B7280;
  font-weight: 400;
}

.add-client-duplicate-banner__menu-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.add-client-duplicate-banner__menu-header {
  padding-top: 18px;
  padding-bottom: 18px;
}

.add-client-duplicate-banner__menu-title-row {
  gap: 10px;
}

.add-client-duplicate-banner__menu-header-icon {
  color: $primary;
}

.add-client-duplicate-banner__menu-subtitle {
  margin-top: 6px;
}

.add-client-duplicate-banner__menu-count-badge {
  background: #F2FBFA;
  border: 1px solid #DDF4F2;
  border-radius: $radius-md;
  padding: 8px 12px;
  color: #006D6F;
  font-weight: 600;
  gap: 8px;
}

.add-client-duplicate-banner__menu-count-icon {
  color: #006D6F;
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
  background: transparent;
  padding: 10px 0;
}

.add-client-duplicate-banner__menu-card .add-client-duplicate-banner__list {
  border: none;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.add-client-duplicate-banner__item {
  min-height: 66px;
  margin: 8px 12px;
  padding-left: 12px;
  padding-right: 10px;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: $radius-md;
  box-shadow:
    inset 0 0 0 1px rgba(229, 231, 235, 0.7),
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.06);
  border-left: 6px solid var(--dup-left-border, rgba(0, 0, 0, 0.12));

  --dup-badge-bg: #fff;
  --dup-badge-color: #111827;
  --dup-badge-border: #E5E7EB;
  --dup-avatar-bg: #F3F4F6;
  --dup-avatar-icon-color: #6B7280;
  --dup-status-dot: #6B7280;
}

.add-client-duplicate-banner__score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  min-width: 220px;
}

.add-client-duplicate-banner__item--high {
  --dup-left-border: #22C55E;
  --dup-badge-bg: #EAF8F0;
  --dup-badge-color: #157347;
  --dup-badge-border: #B8E2C8;
  --dup-avatar-bg: #DDF5E7;
  --dup-avatar-icon-color: #157347;
  --dup-status-dot: #16A34A;
}

.add-client-duplicate-banner__item--medium {
  --dup-left-border: #2196F3;
  --dup-badge-bg: #EAF3FF;
  --dup-badge-color: #1565C0;
  --dup-badge-border: #C9DFFF;
  --dup-avatar-bg: #E2F0FF;
  --dup-avatar-icon-color: #1565C0;
  --dup-status-dot: #1D7AE8;
}

.add-client-duplicate-banner__item--low {
  --dup-left-border: #FFB300;
  --dup-badge-bg: #FFF5E6;
  --dup-badge-color: #B7791F;
  --dup-badge-border: #F6D89B;
  --dup-avatar-bg: #FFF0D8;
  --dup-avatar-icon-color: #C57C00;
  --dup-status-dot: #F59E0B;
}

.add-client-duplicate-banner__item--unknown {
  --dup-left-border: #E5E7EB;
  --dup-badge-bg: #F9FAFB;
  --dup-badge-color: #6B7280;
  --dup-badge-border: #E5E7EB;
  --dup-avatar-bg: #F3F4F6;
  --dup-avatar-icon-color: #6B7280;
  --dup-status-dot: #6B7280;
}

.add-client-duplicate-banner__avatar {
  width: 40px;
  height: 40px;
}

.add-client-duplicate-banner__full-name {
  font-weight: 600;
  color: #111827;
  font-size: 1rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-client-duplicate-banner__meta {
  color: #6B7280;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-client-duplicate-banner__dob-icon {
  flex: 0 0 auto;
  color: $primary;
}

.add-client-duplicate-banner__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--dup-badge-bg);
  border: 1px solid var(--dup-badge-border);
  color: var(--dup-badge-color);
  border-radius: 999px;
  padding: 7px 12px;
  font-weight: 600;
  font-size: 0.8125rem;
  line-height: 1.2;
  white-space: nowrap;
}

.add-client-duplicate-banner__badge-icon {
  font-size: 16px;
  color: var(--dup-badge-color);
}

.add-client-duplicate-banner__badge-score {
  font-weight: 600;
}

.add-client-duplicate-banner__badge-sep {
  opacity: 0.9;
}

.add-client-duplicate-banner__badge-term {
  font-weight: 600;
}

.add-client-duplicate-banner__confidence-label {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
  color: var(--dup-badge-color);
  font-weight: 600;
  font-size: 0.75rem;
  line-height: 1.2;
}

.add-client-duplicate-banner__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--dup-status-dot);
  flex: 0 0 auto;
}

.add-client-duplicate-banner__actions {
  flex-shrink: 0;
  align-self: flex-start;
  padding-top: 2px;
}

.add-client-duplicate-banner__menu-card {
  min-width: 520px;
  max-width: min(100vw - 24px, 720px);

  border-radius: $radius-md;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.06);
}
</style>
