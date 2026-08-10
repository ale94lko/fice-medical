<template>
  <div
    class="admin-contact-overflow row items-center no-wrap"
    :class="{
      'admin-contact-overflow--header': variant === 'header',
    }">
    <span
      class="admin-contact-overflow__primary row items-center no-wrap">
      <span
        v-if="typeBeforeValue && firstType"
        class="admin-contact-overflow__type
          admin-contact-overflow__type--before">
        {{ firstType }}:
      </span>
      <slot name="value" :entry="firstEntry">
        <span class="admin-contact-overflow__value">
          {{ firstValue }}
        </span>
      </slot>
      <span
        v-if="!typeBeforeValue && firstType"
        class="admin-contact-overflow__type">
        {{ firstType }}
      </span>
    </span>
    <AdminTableHoverCard v-if="extraCount > 0">
      <template #anchor>
        <span
          class="admin-contact-overflow__more"
          tabindex="0"
          :aria-label="`+${extraCount}`">
          +{{ extraCount }}
        </span>
      </template>
      <div class="admin-contact-overflow__tip-card">
        <div
          v-for="(entry, index) in extraEntries"
          :key="entryKey(entry, index)"
          class="admin-contact-overflow__tip-item row no-wrap
            items-center">
          <q-icon
            :name="icon"
            size="16px"
            class="admin-contact-overflow__tip-icon"
          />
          <div class="admin-contact-overflow__tip-body col">
            <div class="admin-contact-overflow__tip-value">
              {{ entryValue(entry) }}
            </div>
            <div
              v-if="entryType(entry)"
              class="admin-contact-overflow__tip-type">
              {{ entryType(entry) }}
            </div>
          </div>
          <q-btn
            v-if="entryValue(entry)"
            flat
            dense
            round
            size="xs"
            icon="content_copy"
            class="admin-contact-overflow__tip-copy
              app-btn-icon-action"
            :aria-label="t('adminContactCopy')"
            @click.stop="copyEntry(entry)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('adminContactCopy') }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>
    </AdminTableHoverCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar, copyToClipboard } from 'quasar'
import { quasarNotifyTypes } from 'components/constants.js'
import AdminTableHoverCard from
  'components/admin-table/AdminTableHoverCard.vue'

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
  valueKey: {
    type: String,
    default: 'value',
  },
  typeKey: {
    type: String,
    default: 'type',
  },
  icon: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: 'table',
    validator: value => ['table', 'header'].includes(value),
  },
  typeBeforeValue: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()
const $q = useQuasar()

const firstEntry = computed(() => props.entries[0] ?? null)
const extraEntries = computed(() => props.entries.slice(1))
const extraCount = computed(() => extraEntries.value.length)

const firstValue = computed(() => entryValue(firstEntry.value))
const firstType = computed(() => entryType(firstEntry.value))

function entryValue(entry) {
  if (!entry) {
    return ''
  }

  return String(entry[props.valueKey] ?? '').trim()
}

function entryType(entry) {
  if (!entry) {
    return ''
  }

  return String(entry[props.typeKey] ?? '').trim()
}

function entryKey(entry, index) {
  const id = entry?.id ?? entry?.key
  if (id != null && id !== '') {
    return String(id)
  }

  const value = entryValue(entry)

  return value || `contact-${index}`
}

function copyEntry(entry) {
  const text = entryValue(entry)
  if (!text) {
    return
  }

  copyToClipboard(text)
    .then(() => {
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('adminContactCopied'),
        position: 'top',
      })
    })
    .catch(() => {})
}
</script>
