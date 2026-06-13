<template>
  <div
    v-if="visible"
    class="banner"
    :class="{ 'banner--in-header': inPageHeader }"
    :data-testid="tid.banner">
    <data-item-component
      :title="t('duplicateMatchBannerTitle', { count: matches.length })"
      :sub-title="t('duplicateMatchBannerHint')"
      icon="warning"
      icon-style="warning">
      <template #actions>
        <div class="banner__actions row items-center no-wrap q-gutter-sm">
          <q-btn
            no-caps
            unelevated
            icon="warning_amber"
            class="banner__action-btn"
            :data-testid="tid.btnIgnore"
            :label="t('duplicateMatchIgnore')"
            @click="emit('ignore')"
          />
          <q-btn
            no-caps
            unelevated
            icon-right="expand_more"
            class="banner__action-btn banner__toggle"
            :data-testid="tid.btnViewMatches"
            :label="t('duplicateMatchViewMatches')">
            <q-menu
              v-model="menuOpen"
              anchor="bottom end"
              self="top end"
              class="banner__menu"
              @hide="menuShowAll = false">
              <q-card flat class="banner__menu-card">
                <q-item
                  v-ripple
                  :class="[
                  'banner__menu-header',
                ]">
                  <q-item-section avatar>
                    <q-avatar
                      icon="person"
                      size="40px"
                      class="banner__avatar"
                      :style="{
                      backgroundColor: 'var(--dup-avatar-bg)',
                      color: 'var(--dup-avatar-icon-color)',
                    }"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      class="banner__full-name">
                      {{ t('duplicateMatchMenuTitle') }}
                    </q-item-label>
                    <q-item-label
                      caption
                      class="banner__meta">
                    <span>
                      {{ t('duplicateMatchMenuSubtitle') }}
                    </span>
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="banner__menu-header-row
                    row items-start no-wrap">
                      <div class="banner__menu-count-badge
                      row items-center no-wrap">
                        <q-icon
                          name="people"
                          size="18px"
                          class="banner__menu-count-icon"
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
                  class="banner__list"
                  :style="{ maxHeight: menuListMaxHeight }">
                  <q-item
                    v-for="m in displayedMatches"
                    clickable
                    v-ripple
                    :key="m.patientId"
                    :class="[
                    'banner__item',
                    tierClass(m.matchConfidence),
                  ]"
                    :data-testid="tid.row(m.patientId)"
                    @click="onPickMatch(m)">
                    <q-item-section avatar>
                      <q-avatar
                        icon="person"
                        size="40px"
                        class="banner__avatar"
                        :style="{
                        backgroundColor: 'var(--dup-avatar-bg)',
                        color: 'var(--dup-avatar-icon-color)',
                      }"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label
                        class="banner__full-name">
                        {{ displayMatchName(m.fullName) }}
                      </q-item-label>
                      <q-item-label
                        caption
                        class="banner__meta">
                        <q-icon
                          name="event"
                          size="14px"
                          class="banner__dob-icon"
                        />
                        <span>
                        {{ dobLabel(m.dateOfBirth) }}
                      </span>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section
                      side
                      class="banner__score">
                      <div class="banner__badge">
                        <q-icon
                          :name="badgeIconForConfidence(m.matchConfidence)"
                          class="banner__badge-icon"
                        />
                        <span class="banner__badge-score">
                        {{ Math.round(Number(m.matchScore) || 0) }}%
                      </span>
                        <span class="banner__badge-sep">
                        •
                      </span>
                        <span class="banner__badge-term">
                        {{ badgeTermForConfidence(m.matchConfidence) }}
                      </span>
                      </div>
                      <div class="banner__confidence-label">
                        <span class="banner__status-dot" />
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
      </template>
    </data-item-component>
    <q-inner-loading :showing="loading" color="primary" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { isoDateToUsDateString } from 'src/utils/client-form.js'
import { sortDuplicateMatches } from 'src/utils/client-duplicate-match-sort.js'
import { addClientTestIds } from 'src/test-ids/index.js'
import DataItemComponent from 'components/template/DataItemComponent.vue'

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
    return 'banner__item--high'
  }
  if (u === 'MEDIUM' || u === 'MEDIA') {
    return 'banner__item--medium'
  }
  if (u === 'LOW' || u === 'BAJA') {
    return 'banner__item--low'
  }

  return 'banner__item--unknown'
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

  if (tokens.length > 1) {
    const last = tokens[tokens.length - 1].replace(/[.,]+$/u, '')
    if (suffixes.has(last.toUpperCase())) {
      tokens.pop()
    }
  }

  if (tokens.length > 1) {
    const first = tokens[0].replace(/[.,]+$/u, '')
    if (prefixes.has(first.toUpperCase())) {
      tokens.shift()
    }
  }

  return tokens.join(' ').trim()
}
</script>
