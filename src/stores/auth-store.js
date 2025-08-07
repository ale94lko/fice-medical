import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import { sha256 } from 'js-sha256'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    xTenantId: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token
  },
  actions: {
    initializeAuth() {
      // TODO: hacer la peticion a la api para validar el token
      this.token = 'asd'
    },
    async login(email, pass) {
      try {
        const password = sha256(pass)
        const response = await apiInstance.get('/api/public', {
          email: email,
          password: password
        })

        this.token = response.data.token
        this.xTenantId = response.data.xTenantId
      } catch (error) {
        console.error('Error fetching clients:', error)
        throw error
      }
    },
    async logout(router) {
      // TODO: Hacer la peticion para invalidar el token
      this.token = null
      await router.push('/login')
    }
  }
})
