<template>
  <div class="admin-clinician-avatars row items-center no-wrap">
    <span
      v-for="(entry, index) in entries"
      :key="entryKey(entry, index)"
      class="admin-clinician-avatars__avatar"
      :style="clinicianAvatarStyle(entry.id ?? entry.name)"
      :aria-label="entry.name">
      {{ entry.initials || '?' }}
      <q-tooltip
        anchor="top middle"
        self="bottom middle"
        class="admin-clinician-avatars__tooltip"
        :offset="[0, 6]">
        <div class="admin-clinician-avatars__tooltip-name">
          {{ tooltipPersonName(entry) }}
        </div>
        <div
          v-if="tooltipSpecialty(entry)"
          class="admin-clinician-avatars__tooltip-specialty">
          {{ tooltipSpecialty(entry) }}
        </div>
      </q-tooltip>
    </span>
  </div>
</template>

<script setup>
import { clinicianAvatarStyle } from 'src/utils/clinician-display.js'

defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
})

function entryKey(entry, index) {
  const id = entry?.id
  if (id != null && id !== '') {
    return String(id)
  }

  return entry?.name ?? entry?.initials ?? `clinician-${index}`
}

function tooltipPersonName(entry) {
  const personName = String(entry?.personName ?? '').trim()
  if (personName) {
    return personName
  }

  const label = String(entry?.name ?? '').trim()
  if (!label) {
    return ''
  }

  return label.split(' - ')[0]?.trim() || label
}

function tooltipSpecialty(entry) {
  const specialty = String(entry?.specialty ?? '').trim()
  if (specialty) {
    return specialty
  }

  const label = String(entry?.name ?? '').trim()
  const parts = label.split(' - ')

  return parts.length > 1
    ? parts.slice(1).join(' - ').trim()
    : ''
}
</script>
