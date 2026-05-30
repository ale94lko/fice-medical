import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  buildClientCreateBody,
  buildClientUpdateBody,
  extractClientMutationResponse,
  extractEnvelopeList,
  extractEnvelopeListPagination,
  formatClientDisplay,
  mapClient,
  mapClientApiToForm,
} from 'components/helpers.js'

function indexClientListSource(list) {
  const byId = {}
  for (const client of list) {
    const id = client?.id
    if (id != null && id !== '') {
      byId[String(id)] = client
    }
  }

  return byId
}

export const useSiteStore = defineStore('site', {
  state: () => ({
    clientList: [],
    clientListSourceById: {},
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
          this.clientListSourceById = {}
          this.clientListPagination = null

          return
        }

        const list = extractEnvelopeList(root)
        this.clientListSourceById = indexClientListSource(list)
        this.clientList = list
          .map(client => formatClientDisplay(mapClient(client), t))
          .filter(Boolean)
        this.clientListPagination = extractEnvelopeListPagination(root)
      } catch (error) {
        console.error('Error fetching clients:', error)
        throw error
      }
    },
    async createClient(form, t) {
      const body = buildClientCreateBody(form)
      const response = await apiInstance.post(apiPaths.clientsCreate, body)
      const created = extractClientMutationResponse(response.data)
      await this.getClientList(
        {
          page: 1,
          limit: this.clientListQuery.limit,
        },
        t,
      )

      return created
    },
    buildEditFormFromListClient(clientId, options = {}) {
      const id = String(clientId ?? '').trim()
      if (!id) {
        throw new Error('Missing client id')
      }
      const raw = this.clientListSourceById[id]
      if (!raw) {
        throw new Error('Client not found in list')
      }
      const mapped = mapClientApiToForm(raw, options)
      if (!mapped) {
        throw new Error('Could not map client data')
      }

      return mapped
    },
    async updateClient(clientId, form, t) {
      const body = buildClientUpdateBody(clientId, form)
      const response = await apiInstance.put(apiPaths.clientsUpdate, body)
      const updated = extractClientMutationResponse(response.data)
      await this.getClientList(
        {
          page: this.clientListQuery.page,
          limit: this.clientListQuery.limit,
        },
        t,
      )

      return updated
    },
  },
})
