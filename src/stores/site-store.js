import { defineStore } from 'pinia'
//import { apiInstance } from 'boot/axios'

export const useSiteStore = defineStore('site', {
  state: () => ({
    clientList: [],
    loading: false,
  }),
  actions: {
    async getClientList() {
      // this.loading = true
      //
      // try {
      //   const response = await apiInstance.get('/clients')
      //
      //   this.clientList = response.data.results
      //
      //   for (const client of this.clientList) {
      //     client.full_name = client.name.title
      //       + ' ' + client.name.first
      //       + ' ' + client.name.last
      //   }
      //
      // } catch (error) {
      //   console.error('Error fetching clients:', error)
      //   throw error
      // } finally {
      //   this.loading = false
      // }
    },
  }
})
