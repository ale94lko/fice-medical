import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

const api = axios.create({ baseURL: 'https://4280349e8d5b.ngrok-free.app' })

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api

  // Para Composition API (provide/inject)
  app.provide('api', api)
})

export const apiInstance = api
