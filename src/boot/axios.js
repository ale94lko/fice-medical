import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

const api = axios.create({ baseURL: 'https://1ac28fb21d41.ngrok-free.app' })

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api

  // Para Composition API (provide/inject)
  app.provide('api', api)
})

export const apiInstance = api
