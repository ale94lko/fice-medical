import {
  computed,
  reactive,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { screeningStatuses, quasarNotifyTypes } from 'components/constants.js'
import {
  answersArrayFromMap,
  countAnsweredQuestions,
  validateRequiredAnswers,
} from 'src/utils/screening-answers.js'
import {
  calculateScreeningBmi,
  formatScreeningBmiDisplay,
  measurementsToFormValues,
  validateScreeningMeasurements,
} from 'src/utils/screening-measurements.js'
import {
  cancelClientScreening,
  completeClientScreening,
  saveScreeningDraft,
  screeningApiErrorMessage,
} from 'src/utils/screening-api.js'
import { isoDateToUsDateString } from 'src/utils/client-form.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'
import { calculateScreeningScore, deriveScreeningRiskLevel }
  from 'src/utils/screening-scores.js'
import { buildSectionStatusList } from 'src/utils/screening-section-status.js'

export function useScreeningEditor(getContext) {
  const { t } = useI18n()
  const $q = useQuasar()
  const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

  const answers = reactive({})
  const measurements = reactive({ weight: '', height: '' })
  const fieldErrors = reactive({})
  const measurementErrors = reactive({})
  const saving = ref(false)
  const saveMode = ref('')
  const sectionExpanded = reactive({})

  function ctx() {
    return typeof getContext === 'function' ? getContext() : getContext
  }

  function resetAnswers(next = {}) {
    for (const key of Object.keys(answers)) {
      delete answers[key]
    }
    Object.assign(answers, next ?? {})
  }

  function syncFromContext() {
    const { screening, initialAnswers } = ctx()
    resetAnswers(initialAnswers ?? {})
    const values = measurementsToFormValues(screening)
    measurements.weight = values.weight
    measurements.height = values.height
  }

  watch(
    () => [
      ctx().screening?.id,
      ctx().initialAnswers,
    ],
    () => {
      syncFromContext()
    },
    { immediate: true, deep: true },
  )

  watch(
    () => ctx().template?.sections,
    sections => {
      for (const section of sections ?? []) {
        if (sectionExpanded[section.id] === undefined) {
          sectionExpanded[section.id] = true
        }
      }
    },
    { immediate: true },
  )

  const bmiDisplay = computed(() => {
    const bmi = calculateScreeningBmi(
      measurements.weight,
      measurements.height,
    )

    return formatScreeningBmiDisplay(bmi)
  })

  const isDraft = computed(
    () => ctx().screening?.status === screeningStatuses.draft,
  )

  const isReadonly = computed(
    () => ctx().readonly
      || ctx().screening?.status === screeningStatuses.completed
      || ctx().screening?.status === screeningStatuses.cancelled,
  )

  const canEditDraft = computed(() => isDraft.value && !ctx().readonly)

  const showMeasurements = computed(
    () => Boolean(
      measurements.weight
      || measurements.height
      || ctx().screening?.weight
      || ctx().screening?.height,
    ),
  )

  const completedAtDisplay = computed(() => {
    const raw = ctx().screening?.completedAt
    if (!raw) {
      return ''
    }

    return isoDateToUsDateString(raw) || String(raw).trim()
  })

  const statusLabel = computed(() => {
    const status = ctx().screening?.status
    if (status === screeningStatuses.completed) {
      return t('screeningStatusCompleted')
    }
    if (status === screeningStatuses.cancelled) {
      return t('screeningStatusCancelled')
    }
    if (status === screeningStatuses.draft) {
      return t('screeningStatusInProgress')
    }

    return t('screeningStatusDraft')
  })

  const answerProgress = computed(() =>
    countAnsweredQuestions(ctx().template, answers),
  )

  const completionPercent = computed(() => {
    const { total, answered } = answerProgress.value
    if (!total) {
      return 0
    }

    return Math.round((answered / total) * 100)
  })

  const scoreSummary = computed(() =>
    calculateScreeningScore(ctx().template, answers),
  )

  const riskLevel = computed(() =>
    deriveScreeningRiskLevel(ctx().template, answers),
  )

  const sectionStatuses = computed(() =>
    buildSectionStatusList(ctx().template, answers),
  )

  function buildSavePayload() {
    return {
      answers: answersArrayFromMap(answers),
    }
  }

  function clearMeasurementErrors() {
    Object.keys(measurementErrors).forEach(key => {
      delete measurementErrors[key]
    })
  }

  function validateMeasurementsBeforeSave() {
    clearMeasurementErrors()
    const hasInput = String(measurements.weight ?? '').trim()
      || String(measurements.height ?? '').trim()
    if (!hasInput) {
      return true
    }
    const errors = validateScreeningMeasurements(measurements, t)
    Object.assign(measurementErrors, errors)

    return Object.keys(errors).length === 0
  }

  async function persistDraft() {
    if (!canEditDraft.value) {
      return false
    }
    if (!ctx().screening?.id) {
      return false
    }
    if (!validateMeasurementsBeforeSave()) {
      await notifyAndScrollToValidationErrors(null)

      return false
    }
    saving.value = true
    saveMode.value = 'draft'
    Object.keys(fieldErrors).forEach(key => {
      delete fieldErrors[key]
    })
    try {
      await saveScreeningDraft(
        ctx().patientId,
        ctx().screening.id,
        buildSavePayload(),
      )
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('screeningDraftSaved'),
        position: 'top',
      })
      ctx().onSaved?.({ status: screeningStatuses.draft })

      return true
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        $q.notify({
          type: quasarNotifyTypes.negative,
          message: screeningApiErrorMessage(
            error,
            t('screeningSaveError'),
          ),
          position: 'top',
        })
      }

      return false
    } finally {
      saving.value = false
      saveMode.value = ''
    }
  }

  async function onSaveDraft() {
    await persistDraft()
  }

  async function onComplete() {
    if (!validateMeasurementsBeforeSave()) {
      await notifyAndScrollToValidationErrors(null)

      return
    }
    Object.keys(fieldErrors).forEach(key => {
      delete fieldErrors[key]
    })
    const errors = validateRequiredAnswers(ctx().template, answers)
    Object.assign(fieldErrors, errors)
    if (Object.keys(errors).length) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('screeningCompleteValidation'),
        position: 'top',
      })
      await notifyAndScrollToValidationErrors(null)

      return
    }
    saving.value = true
    saveMode.value = 'complete'
    try {
      await completeClientScreening(
        ctx().patientId,
        ctx().screening.id,
        buildSavePayload(),
      )
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('screeningCompleted'),
        position: 'top',
      })
      ctx().onSaved?.({ status: screeningStatuses.completed })
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        $q.notify({
          type: quasarNotifyTypes.negative,
          message: screeningApiErrorMessage(
            error,
            t('screeningCompleteValidation'),
          ),
          position: 'top',
        })
      }
    } finally {
      saving.value = false
      saveMode.value = ''
    }
  }

  function onCancel() {
    $q.dialog({
      title: t('screeningCancelTitle'),
      message: t('screeningCancelConfirm'),
      cancel: { label: t('cancel'), flat: true, noCaps: true },
      ok: {
        label: t('screeningCancel'),
        color: 'negative',
        unelevated: true,
        noCaps: true,
      },
      persistent: true,
    }).onOk(async() => {
      saving.value = true
      saveMode.value = 'cancel'
      try {
        await cancelClientScreening(
          ctx().patientId,
          ctx().screening.id,
        )
        $q.notify({
          type: quasarNotifyTypes.positive,
          message: t('screeningCancelled'),
          position: 'top',
        })
        ctx().onSaved?.({ status: screeningStatuses.cancelled })
      } catch (error) {
        if (!isAuthSessionEndUIError(error)) {
          $q.notify({
            type: quasarNotifyTypes.negative,
            message: screeningApiErrorMessage(
              error,
              t('screeningCancelError'),
            ),
            position: 'top',
          })
        }
      } finally {
        saving.value = false
        saveMode.value = ''
      }
    })
  }

  function scrollToSection(sectionId) {
    sectionExpanded[sectionId] = true
    const el = document.querySelector(
      `[data-screening-section="${sectionId}"]`,
    )
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return {
    answers,
    measurements,
    fieldErrors,
    measurementErrors,
    saving,
    saveMode,
    sectionExpanded,
    bmiDisplay,
    isDraft,
    isReadonly,
    canEditDraft,
    showMeasurements,
    completedAtDisplay,
    statusLabel,
    answerProgress,
    completionPercent,
    scoreSummary,
    riskLevel,
    sectionStatuses,
    onSaveDraft,
    onComplete,
    onCancel,
    scrollToSection,
  }
}
