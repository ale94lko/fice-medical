import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    expireAt: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token
  },
  actions: {
    async login(email, pass, t) {
      try {
        const response = await apiInstance.post('/oauth/login', {
          email: email,
          password: pass
        })

        this.token = response.data.token
        this.expireAt = response.data.expiration

        sessionStorage.setItem('token', this.token)
        sessionStorage.setItem('expireAt', this.expireAt)

        return true
      } catch (error) {
        switch (error.status) {
          case 401:
            throw new Error(t('invalid_credentials'))
        }

        throw error
      }
    },
    async logout(router) {
      await apiInstance.post('/logout', {}, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })

      this.token = null
      this.expireAt = null
      sessionStorage.clear()
      await router.push('/login')
    },
    restoreSession() {
      const token = sessionStorage.getItem('token')
      const expireAt = sessionStorage.getItem('expireAt')

      if (token && expireAt && new Date() < new Date(expireAt)) {
        this.token = token
        this.expireAt = expireAt
      }
    },
  }
})
