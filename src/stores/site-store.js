import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import { apiPaths, catalogNames } from 'components/constants.js'
import {
  buildClientCreateBody,
  buildClientUpdateBody,
  extractClientMutationResponse,
  extractClientWarnings,
  extractEnvelopeListPagination,
  mapClientApiToForm,
} from 'components/helpers.js'
import {
  applyClientListColumnPreferencesState,
  columnConfigToApiPayload,
  defaultClientListColumnPreferences,
  normalizeColumnCatalogFromApi,
  normalizeVisibleColumnsFromApi,
  preferencesFromColumnConfig,
} from 'src/utils/client-list-columns.js'
import { attachEncounterIdToClientClinicalBody } from
  'src/utils/encounter-api.js'
import {
  emptyClientListSummary,
  mapClientListSummary,
  mapClientListViewItem,
} from 'src/utils/client-list-normalize.js'
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
    const code = String(
      client?.clientNumber ?? client?.client_number ?? '',
    ).trim()
    if (code) {
      byId[code] = client
    }
  }

  return byId
}

function cloneClientListColumnState(store) {
  return {
    preferences: {
      order: [...store.clientListColumnPreferences.order],
      hidden: [...store.clientListColumnPreferences.hidden],
    },
    catalog: store.clientListColumnCatalog.map(entry => ({ ...entry })),
    visibleColumns: store.clientListVisibleColumns.map(entry => ({
      ...entry,
    })),
  }
}

function restoreClientListColumnState(store, snapshot) {
  store.clientListColumnPreferences = snapshot.preferences
  store.clientListColumnCatalog = snapshot.catalog
  store.clientListVisibleColumns = snapshot.visibleColumns
}

export const useSiteStore = defineStore('site', {
  state: () => ({
    clientList: [],
    clientListSourceById: {},
    clientListPagination: null,
    clientListSummary: emptyClientListSummary(),
    clientListQuery: { page: 1, limit: 20, filter: null, q: null },
    clientListVisibleColumns: [],
    clientListColumnCatalog: [],
    clientListColumnPreferences: defaultClientListColumnPreferences(),
    suffixCatalogSelectOptions: null,
    prefixCatalogSelectOptions: null,
  }),
  actions: {
    async resolveSuffixCatalogSelectOptions() {
      if (
        this.suffixCatalogSelectOptions
        && this.prefixCatalogSelectOptions
      ) {
        return this.suffixCatalogSelectOptions
      }
      try {
        const catalogs = await fetchCatalogsByNames([
          catalogNames.suffix,
          catalogNames.prefix,
        ])
        const suffixCatalog = catalogs[catalogNames.suffix]
        this.suffixCatalogSelectOptions = suffixCatalog
          ? mapCatalogItemsToSelectOptions(
            catalogItemsFromCatalog(suffixCatalog),
          )
          : []
        const prefixCatalog = catalogs[catalogNames.prefix]
        this.prefixCatalogSelectOptions = prefixCatalog
          ? mapCatalogItemsToSelectOptions(
            catalogItemsFromCatalog(prefixCatalog),
          )
          : []
      } catch {
        this.suffixCatalogSelectOptions = []
        this.prefixCatalogSelectOptions = []
      }

      return this.suffixCatalogSelectOptions
    },
    async hydrateClientListFromEnvelope(root, t, queryPatch = {}) {
      if (!root) {
        this.clientList = []
        this.clientListSourceById = {}
        this.clientListPagination = null
        this.clientListSummary = emptyClientListSummary()
        this.clientListVisibleColumns = []
        this.clientListQuery = {
          ...this.clientListQuery,
          ...queryPatch,
        }

        return
      }

      const list = Array.isArray(root.items) ? root.items : []
      this.clientListVisibleColumns = normalizeVisibleColumnsFromApi(
        root.columns,
      )
      this.clientListSourceById = indexClientListSource(list)
      await this.resolveSuffixCatalogSelectOptions()
      const nameCatalogOptions = {
        prefixSelectOptions: this.prefixCatalogSelectOptions ?? [],
        suffixSelectOptions: this.suffixCatalogSelectOptions ?? [],
      }
      this.clientList = list
        .map(item => mapClientListViewItem(item, t, nameCatalogOptions))
        .filter(Boolean)
      this.clientListPagination = extractEnvelopeListPagination(root)
      if (Object.prototype.hasOwnProperty.call(root, 'summary')) {
        this.clientListSummary = mapClientListSummary(root.summary)
      }
      this.clientListQuery = {
        ...this.clientListQuery,
        ...queryPatch,
      }
    },
    async fetchClientListColumnConfig() {
      const response = await apiInstance.get(
        apiPaths.clientsListColumnConfig,
      )
      const root = response?.data?.data
      this.clientListColumnCatalog = normalizeColumnCatalogFromApi(root)
      this.clientListColumnPreferences = preferencesFromColumnConfig(root)
    },
    applyClientListColumnPreferences(preferences) {
      const next = applyClientListColumnPreferencesState(
        preferences,
        this.clientListColumnCatalog,
      )
      this.clientListColumnPreferences = next.preferences
      this.clientListColumnCatalog = next.catalog
      this.clientListVisibleColumns = next.visibleColumns
    },
    persistClientListColumnConfig(preferences) {
      const payload = columnConfigToApiPayload(
        preferences,
        this.clientListColumnCatalog,
      )
      const snapshot = cloneClientListColumnState(this)
      this.applyClientListColumnPreferences(preferences)

      return apiInstance
        .put(apiPaths.clientsListColumnConfig, payload)
        .catch((error) => {
          restoreClientListColumnState(this, snapshot)
          throw error
        })
    },
    saveClientListColumnConfig(preferences) {
      return this.persistClientListColumnConfig(preferences)
    },
    resetClientListColumnConfig() {
      const defaults = defaultClientListColumnPreferences()

      return this.persistClientListColumnConfig(defaults)
    },
    async getClientList(params = {}, t) {
      try {
        const page = Number(params.page ?? this.clientListQuery.page ?? 1)
        const limit = Number(params.limit ?? this.clientListQuery.limit ?? 20)
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        // Explicit `filter: null` must clear; do not fall back via `??`.
        const filter = Object.prototype.hasOwnProperty.call(params, 'filter')
          ? (params.filter || null)
          : (this.clientListQuery.filter ?? null)
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
      this.putClientDetailInSource(client)
      this.clientListSourceById[id] = client

      return client
    },
    /**
     * List-view rows omit clinical nests (medications, care plans, etc.).
     * After getClientList replaces the index, put back the create/patch body.
     */
    putClientDetailInSource(client) {
      if (!client || typeof client !== 'object') {
        return null
      }
      const id = String(client.id ?? client.client_id ?? '').trim()
      if (!id) {
        return null
      }
      this.clientListSourceById[id] = client
      const code = String(
        client.clientNumber ?? client.client_number ?? '',
      ).trim()
      if (code) {
        this.clientListSourceById[code] = client
      }

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
      this.putClientDetailInSource(created)

      return created
    },
    async updateClient(clientId, form, t) {
      const id = String(clientId ?? '').trim()
      if (!id) {
        throw new Error('Missing client id')
      }
      const body = attachEncounterIdToClientClinicalBody(
        buildClientUpdateBody(form),
        id,
      )
      const response = await apiInstance.patch(apiPaths.clientById(id), body)
      const updated = extractClientMutationResponse(response.data)
      await this.getClientList(
        {
          page: this.clientListQuery.page,
          limit: this.clientListQuery.limit,
        },
        t,
      )
      this.putClientDetailInSource(updated)

      return updated
    },
    async patchClientPartial(clientId, partialBody, t) {
      const id = String(clientId ?? '').trim()
      if (!id) {
        throw new Error('Missing client id')
      }
      const response = await apiInstance.patch(
        apiPaths.clientById(id),
        attachEncounterIdToClientClinicalBody(partialBody, id),
      )
      const client = extractClientMutationResponse(response.data)
      const warnings = extractClientWarnings(response.data)
      await this.getClientList(
        {
          page: this.clientListQuery.page,
          limit: this.clientListQuery.limit,
        },
        t,
      )
      this.putClientDetailInSource(client)

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
