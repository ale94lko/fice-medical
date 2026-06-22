<template>
  <div
    class="admin-clinician-avatars row items-center no-wrap"
    :class="{
      'admin-clinician-avatars--md': size === 'md',
    }">
    <AdminTableHoverCard
      v-for="(entry, index) in entries"
      :key="entryKey(entry, index)"
      class="admin-clinician-avatars__avatar-host">
      <template #anchor>
        <span
          class="admin-clinician-avatars__avatar"
          :style="avatarStyle(entry)"
          :aria-label="entry.name"
          tabindex="0">
          {{ entry.initials || '?' }}
        </span>
      </template>
      <div class="admin-clinician-avatars__tooltip-card row no-wrap">
        <span
          class="admin-clinician-avatars__tooltip-avatar"
          :style="avatarStyle(entry)">
          {{ entry.initials || '?' }}
        </span>
        <div class="admin-clinician-avatars__tooltip-body col">
          <div class="admin-clinician-avatars__tooltip-name">
            {{ tooltipPersonName(entry) }}
          </div>
          <div
            v-if="tooltipSpecialty(entry)"
            class="admin-clinician-avatars__tooltip-specialty">
            {{ tooltipSpecialty(entry) }}
          </div>
        </div>
        <q-icon
          v-if="entry.isPrimary"
          name="star"
          size="18px"
          class="admin-clinician-avatars__tooltip-star"
        />
      </div>
    </AdminTableHoverCard>
  </div>
</template>

<script setup>
import AdminTableHoverCard from
  'components/admin-table/AdminTableHoverCard.vue'
import { clinicianAvatarStyle } from 'src/utils/clinician-display.js'

defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
  size: {
    type: String,
    default: 'sm',
    validator: value => ['sm', 'md'].includes(value),
  },
})

function entryKey(entry, index) {
  const id = entry?.id
  if (id != null && id !== '') {
    return String(id)
  }

  return entry?.name ?? entry?.initials ?? `clinician-${index}`
}

function avatarStyle(entry) {
  if (entry?.avatarStyle) {
    return entry.avatarStyle
  }

  return clinicianAvatarStyle(entry?.id ?? entry?.name)
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
