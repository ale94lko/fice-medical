import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  aiClinicalSummaryScopes,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  aiApiErrorMessage,
  generateClinicalSummary,
} from 'src/utils/ai-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { listClientEncounters } from 'src/utils/encounter-api.js'

export function useClinicalSummaryGenerate(clientId) {
  const { t } = useI18n()
  const $q = useQuasar()
  const generating = ref(false)
  const reviewOpen = ref(false)
  const suggestion = ref(null)

  function encounterTimestamp(row) {
    const raw = row?.completedAtUtc
      || row?.startedAtUtc
      || row?.completedAt
      || row?.startedAt
      || ''
    const ts = Date.parse(raw)

    return Number.isFinite(ts) ? ts : 0
  }

  function pickLastEncounter(list) {
    if (!Array.isArray(list) || !list.length) {
      return null
    }

    return [...list].sort((a, b) => {
      const delta = encounterTimestamp(b) - encounterTimestamp(a)
      if (delta !== 0) {
        return delta
      }

      return Number(b.id || 0) - Number(a.id || 0)
    })[0]
  }

  async function resolveLastEncounterId() {
    const list = await listClientEncounters(clientId.value)

    return pickLastEncounter(list)?.id ?? null
  }

  async function generateByScope(scope) {
    if (!clientId.value || generating.value) {
      return { errorKey: 'aiGenerateError' }
    }
    generating.value = true
    try {
      const body = { scope }
      if (scope === aiClinicalSummaryScopes.currentEncounter) {
        const encounterId = await resolveLastEncounterId()
        if (encounterId == null) {
          $q.notify({
            type: quasarNotifyTypes.warning,
            message: t('aiLastEncounterMissing'),
          })

          return { errorKey: 'aiLastEncounterMissing' }
        }
        body.encounterId = encounterId
      }
      if (scope === aiClinicalSummaryScopes.recentHistory) {
        body.historyDays = 90
      }
      const result = await generateClinicalSummary(
        clientId.value,
        body,
      )
      suggestion.value = result

      return { suggestion: result }
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        $q.notify({
          type: quasarNotifyTypes.negative,
          message: aiApiErrorMessage(error, t('aiGenerateError')),
        })
      }

      return { errorKey: 'aiGenerateError' }
    } finally {
      generating.value = false
    }
  }

  return {
    generating,
    reviewOpen,
    suggestion,
    generateByScope,
  }
}
