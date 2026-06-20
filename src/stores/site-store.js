import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import { apiPaths, catalogNames } from 'components/constants.js'
import {
  buildClientCreateBody,
  buildClientUpdateBody,
  extractClientMutationResponse,
  extractClientWarnings,
  extractEnvelopeList,
  extractEnvelopeListPagination,
  formatClientDisplay,
  mapClient,
  mapClientApiToForm,
} from 'components/helpers.js'
import {
  catalogItemsFromCatalog,
  fetchCatalogsByNames,
  mapCatalogItemsToSelectOptions,
} from 'src/utils/catalogs.js'

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
    clientListQuery: { page: 1, limit: 20, filter: null, q: null },
    suffixCatalogSelectOptions: null,
  }),
  actions: {
    async resolveSuffixCatalogSelectOptions() {
      if (this.suffixCatalogSelectOptions) {
        return this.suffixCatalogSelectOptions
      }
      try {
        const catalogs = await fetchCatalogsByNames([catalogNames.suffix])
        const catalog = catalogs[catalogNames.suffix]
        this.suffixCatalogSelectOptions = catalog
          ? mapCatalogItemsToSelectOptions(
            catalogItemsFromCatalog(catalog),
          )
          : []
      } catch {
        this.suffixCatalogSelectOptions = []
      }

      return this.suffixCatalogSelectOptions
    },
    async hydrateClientListFromEnvelope(root, t, queryPatch = {}) {
      if (!root) {
        this.clientList = []
        this.clientListSourceById = {}
        this.clientListPagination = null
        this.clientListQuery = {
          ...this.clientListQuery,
          ...queryPatch,
        }

        return
      }

      const list = extractEnvelopeList(root)
      const suffixSelectOptions =
        await this.resolveSuffixCatalogSelectOptions()
      this.clientListSourceById = indexClientListSource(list)
      this.clientList = list
        .map(client => formatClientDisplay(
          mapClient(client, { suffixSelectOptions }),
          t,
        ))
        .filter(Boolean)
      this.clientListPagination = extractEnvelopeListPagination(root)
      this.clientListQuery = {
        ...this.clientListQuery,
        ...queryPatch,
      }
    },
    async getClientList(params = {}, t) {
      try {
        const page = Number(params.page ?? this.clientListQuery.page ?? 1)
        const limit = Number(params.limit ?? this.clientListQuery.limit ?? 20)
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        const filter = params.filter ?? this.clientListQuery.filter ?? null
        const apiPage = Math.max(0, safePage - 1)
        const queryParams = {
          page: apiPage,
          limit: safeLimit,
        }
        if (filter) {
          queryParams.filter = filter
        }
        const response = await apiInstance.get(apiPaths.clientsList, {
          params: queryParams,
        })

        const root = response?.data?.data
        await this.hydrateClientListFromEnvelope(root, t, {
          page: safePage,
          limit: safeLimit,
          filter,
          q: null,
        })
      } catch (error) {
        console.error('Error fetching clients:', error)
        throw error
      }
    },
    async searchClientList(params = {}, t) {
      try {
        const q = String(params.q ?? '').trim()
        if (!q) {
          throw new Error('Search query is required')
        }
        const page = Number(params.page ?? this.clientListQuery.page ?? 1)
        const limit = Number(params.limit ?? this.clientListQuery.limit ?? 20)
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        const apiPage = Math.max(0, safePage - 1)
        const response = await apiInstance.get(apiPaths.clientsSearch, {
          params: {
            q,
            page: apiPage,
            limit: safeLimit,
          },
        })

        const root = response?.data?.data
        await this.hydrateClientListFromEnvelope(root, t, {
          page: safePage,
          limit: safeLimit,
          filter: null,
          q,
        })
      } catch (error) {
        console.error('Error searching clients:', error)
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
    async fetchClientById(clientId) {
      const id = String(clientId ?? '').trim()
      if (!id) {
        throw new Error('Missing client id')
      }
      const response = await apiInstance.get(apiPaths.clientById(id))
      const client = extractClientMutationResponse(response.data)
      if (!client || typeof client !== 'object') {
        throw new Error('Client not found')
      }
      this.clientListSourceById[id] = client

      return client
    },
    buildEditFormFromClient(raw, options = {}) {
      const mapped = mapClientApiToForm(raw, options)
      if (!mapped) {
        throw new Error('Could not map client data')
      }

      return mapped
    },
    async buildEditFormForClient(clientId, options = {}) {
      const raw = await this.fetchClientById(clientId)

      return this.buildEditFormFromClient(raw, options)
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

      return this.buildEditFormFromClient(raw, options)
    },
    async updateClient(clientId, form, t) {
      const id = String(clientId ?? '').trim()
      if (!id) {
        throw new Error('Missing client id')
      }
      const body = buildClientUpdateBody(form)
      const response = await apiInstance.patch(apiPaths.clientById(id), body)
      const updated = extractClientMutationResponse(response.data)
      if (updated && typeof updated === 'object') {
        this.clientListSourceById[id] = updated
      }
      await this.getClientList(
        {
          page: this.clientListQuery.page,
          limit: this.clientListQuery.limit,
        },
        t,
      )

      return updated
    },
    async patchClientPartial(clientId, partialBody, t) {
      const id = String(clientId ?? '').trim()
      if (!id) {
        throw new Error('Missing client id')
      }
      const response = await apiInstance.patch(
        apiPaths.clientById(id),
        partialBody,
      )
      const client = extractClientMutationResponse(response.data)
      const warnings = extractClientWarnings(response.data)
      if (client && typeof client === 'object') {
        this.clientListSourceById[id] = client
      }
      await this.getClientList(
        {
          page: this.clientListQuery.page,
          limit: this.clientListQuery.limit,
        },
        t,
      )

      return { client, warnings }
    },
    async patchClientFollowUps(clientId, followUpsPayload, t) {
      return this.patchClientPartial(
        clientId,
        /* eslint-disable-next-line camelcase -- API field */
        { follow_ups: followUpsPayload },
        t,
      )
    },
  },
})
