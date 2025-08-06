import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'

export const useSiteStore = defineStore('site', {
  state: () => ({
    clientList: [],
    clientListColumns: [],
    loading: false,
  }),
  actions: {
    async getClientListColumns() {
      this.loading = true

      try {
        const response = await apiInstance.get('')

        this.clientList = response.data.results

        for (const client of this.clientList) {
          client.full_name = client.name.title
            + ' ' + client.name.first
            + ' ' + client.name.last
        }

        this.clientListColumns = [
          {
            name: 'name',
            required: true,
            label: 'Name',
            align: 'left',
            field: row => row.full_name,
            format: val => `${val}`,
            sortable: true,
          },
        ]

      } catch (error) {
        console.error('Error fetching clients:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
  }
})
