<template>
  <section class="client-overview-alt-basic staff-profile-section">
    <SectionHeading :icon="icon" :title="title" />

    <div class="row q-col-gutter-md">
      <div
        v-for="item in fields"
        :key="item.key"
        class="col-12 col-md-6"
        :class="{
          'col-md-12': item.type === 'list'
            || item.type === 'phones'
            || item.type === 'emails',
        }">
        <p class="client-overview-alt-basic__label">
          {{ item.label }}
        </p>

        <div
          v-if="item.type === 'phones' || item.type === 'emails'"
          class="client-overview-alt-basic__contact">
          <AdminTableContactOverflow
            v-if="item.entries?.length"
            :entries="item.entries"
            value-key="value"
            type-key="type"
            :icon="item.type === 'phones' ? 'phone' : 'mail_outline'"
            variant="header"
          />
          <p
            v-else
            class="client-overview-alt-basic__value">
            —
          </p>
        </div>

        <ul
          v-else-if="item.type === 'list' && item.items?.length"
          class="staff-profile-section__list">
          <li
            v-for="(row, index) in item.items"
            :key="`${item.key}-${index}`"
            class="client-overview-alt-basic__value">
            {{ row }}
          </li>
        </ul>

        <p
          v-else
          class="client-overview-alt-basic__value">
          {{ item.value || '—' }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionHeading from 'components/SectionHeading.vue'
import AdminTableContactOverflow from
  'components/admin-table/AdminTableContactOverflow.vue'

defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  fields: {
    type: Array,
    default: () => [],
  },
})
</script>
