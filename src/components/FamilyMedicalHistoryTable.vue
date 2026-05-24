<template>
  <div
    v-if="entries.length"
    class="add-client-form__fmh-table-wrap">
    <table class="add-client-form__fmh-table">
      <thead>
        <tr>
          <th>{{ t('fmhColRelationship') }}</th>
          <th>{{ t('fmhColConditions') }}</th>
          <th class="add-client-form__fmh-table-actions-col">
            {{ t('actions') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in entries" :key="entry.id">
          <td>{{ entry.familyRelationship }}</td>
          <td>{{ entry.medicalConditions }}</td>
          <td class="add-client-form__fmh-table-actions">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="edit"
              :aria-label="t('edit')"
              @click="emit('edit', entry)"
            />
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="delete"
              :aria-label="t('delete')"
              @click="emit('delete', entry)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="add-client-form__fmh-empty text-body2 text-grey-7">
    {{ emptyLabel }}
  </p>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['edit', 'delete'])

const { t } = useI18n()
</script>
