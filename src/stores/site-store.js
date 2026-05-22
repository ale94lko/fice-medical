import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  extractEnvelopeList,
  extractEnvelopeListPagination,
  formatClientDisplay,
  mapClient,
} from 'components/helpers.js'

export const useSiteStore = defineStore('site', {
  state: () => ({
    clientList: [],
    clientListPagination: null,
    clientListQuery: { page: 1, limit: 20 },
  }),
  actions: {
    async getClientList(params = {}, t) {
      try {
        const page = Number(params.page ?? this.clientListQuery.page ?? 1)
        const limit = Number(params.limit ?? this.clientListQuery.limit ?? 20)
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        this.clientListQuery = { page: safePage, limit: safeLimit }

        const apiPage = Math.max(0, safePage - 1)
        const response = await apiInstance.get(apiPaths.clientsList, {
          params: {
            page: apiPage,
            limit: safeLimit,
          },
        })

        const root = response?.data?.data
        if (!root) {
          this.clientList = []
          this.clientListPagination = null

          return
        }

        const list = extractEnvelopeList(root)
        this.clientList = list
          .map(client => formatClientDisplay(mapClient(client), t))
          .filter(Boolean)
        this.clientListPagination = extractEnvelopeListPagination(root)
      } catch (error) {
        console.error('Error fetching clients:', error)
        throw error
      }
    },
  },
})
