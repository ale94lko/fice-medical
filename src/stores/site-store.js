import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'

export const useSiteStore = defineStore('site', {
  state: () => ({
    clientList: [],
  }),
  actions: {
    async getClientList() {
      try {
        const response = await apiInstance.get('/user/all_clients')

        if (response) {
          this.clientList = response.data
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
        throw error
      }
    },
  }
})
