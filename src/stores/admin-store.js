import { defineStore } from 'pinia'
import {
  createTenantUser,
  deleteTenantUser,
  listTenantUsers,
  updateTenantUser,
} from 'src/utils/user-list-api.js'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    userList: [],
    userListPagination: null,
    userListQuery: {
      page: 1,
      limit: 20,
      q: null,
      status: null,
      role: null,
    },
  }),
  actions: {
    applyUserListResult(result, queryPatch = {}) {
      this.userList = Array.isArray(result?.items) ? result.items : []
      this.userListPagination = result?.pagination ?? null
      this.userListQuery = {
        ...this.userListQuery,
        ...queryPatch,
      }
    },
    async getUserList(params = {}, t) {
      const page = Number(params.page ?? this.userListQuery.page ?? 1)
      const limit = Number(params.limit ?? this.userListQuery.limit ?? 20)
      const q = params.q ?? this.userListQuery.q ?? null
      const status = params.status ?? this.userListQuery.status ?? null
      const role = params.role ?? this.userListQuery.role ?? null
      const safePage = Number.isFinite(page) && page >= 1 ? page : 1
      const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20

      const result = await listTenantUsers({
        page: safePage,
        limit: safeLimit,
        q: q ? String(q).trim() : '',
        status: status ? String(status).trim() : '',
        role: role ? String(role).trim() : '',
      }, t)

      this.applyUserListResult(result, {
        page: safePage,
        limit: safeLimit,
        q: q ? String(q).trim() : null,
        status: status ? String(status).trim() : null,
        role: role ? String(role).trim() : null,
      })
    },
    async createUser(payload, t, options = {}) {
      await createTenantUser(payload, options)
      await this.getUserList(
        { page: 1, limit: this.userListQuery.limit },
        t,
      )
    },
    async updateUser(userId, payload, t) {
      await updateTenantUser(userId, payload)
      await this.getUserList(
        {
          page: this.userListQuery.page,
          limit: this.userListQuery.limit,
          q: this.userListQuery.q,
        },
        t,
      )
    },
    async deleteUser(userId, t) {
      await deleteTenantUser(userId)
      await this.getUserList(
        {
          page: this.userListQuery.page,
          limit: this.userListQuery.limit,
          q: this.userListQuery.q,
        },
        t,
      )
    },
  },
})
