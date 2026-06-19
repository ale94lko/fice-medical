<template>
  <div
    v-if="entries.length"
    class="fmh-table-wrap">
    <table class="fmh-table">
      <thead>
        <tr>
          <th>{{ t('fmhColRelationship') }}</th>
          <th>{{ t('fmhColConditions') }}</th>
          <th class="fmh-table-actions-col">
            {{ t('actions') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in entries" :key="entry.id">
          <td>{{ entry.familyRelationship }}</td>
          <td>{{ entry.medicalConditions }}</td>
          <td class="fmh-table-actions">
            <template v-if="canEdit">
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="edit"
              :data-testid="tid.fmhRowEdit(entry.id)"
              :aria-label="t('edit')"
              @click="emit('edit', entry)"
            />
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="delete"
              :data-testid="tid.fmhRowDelete(entry.id)"
              :aria-label="t('delete')"
              @click="emit('delete', entry)"
            />
            </template>
            <span v-else class="text-grey-6">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="fmh-empty text-body2 text-grey-7">
    {{ emptyLabel }}
  </p>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { addClientTestIds as tid } from 'src/test-ids/index.js'

defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  canEdit: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['edit', 'delete'])

const { t } = useI18n()
</script>
