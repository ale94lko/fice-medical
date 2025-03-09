import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
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
      console.log(email, pass)
      // TODO: hacer la peticion para el login
      this.token = 'asd'

      return {
        result: true,
      }
    },
    async logout(router) {
      // TODO: Hacer la peticion para invalidar el token
      this.token = null
      await router.push('/login')
    }
  }
})
