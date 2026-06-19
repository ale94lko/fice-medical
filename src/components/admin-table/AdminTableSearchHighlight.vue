<template>
  <span class="admin-table-search-highlight">
    <template
      v-for="(part, index) in parts"
      :key="index">
      <mark
        v-if="part.match"
        class="admin-table-search-highlight__mark">
        {{ part.text }}
      </mark>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { splitTextBySearchQuery } from 'src/utils/client-list-search.js'

const props = defineProps({
  text: {
    type: [String, Number],
    default: '',
  },
  query: {
    type: String,
    default: '',
  },
})

const parts = computed(() =>
  splitTextBySearchQuery(props.text, props.query),
)
</script>
