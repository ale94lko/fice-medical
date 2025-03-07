import { defineStore } from 'pinia'

export default defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
  }),
  getters: {
  },
  actions: {
    initializeAuth() {
      console.log('initializeAuth')
    }
  }
})
