import { setAppDateTimeConfig } from 'src/utils/app-datetime.js'

export function syncAppDateTimeConfigFromAuth(configData) {
  if (!configData || typeof configData !== 'object') {
    setAppDateTimeConfig(null)

    return
  }
  setAppDateTimeConfig(configData)
}
