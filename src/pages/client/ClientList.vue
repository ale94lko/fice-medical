<template>
  <q-page>
    <q-table
      title="Clients"
      :rows="rows"
      :columns="columns"
      row-key="name"
    />
  </q-page>
</template>

<script>
import { useSiteStore } from 'stores/site-store.js'

export default {
  data() {
    return {
    }
  },
  created() {
    this.loadData()
  },
  computed: {
    columns() {
      return useSiteStore().clientListColumns
    },
    rows() {
      return useSiteStore().clientList
    }
  },
  methods: {
    async loadData() {
      const store = useSiteStore()
      await store.getClientListColumns()
    },
  },
}
</script>
