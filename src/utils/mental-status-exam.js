export const mentalStatusExamDefinition = 'MENTAL_STATUS_EXAM'

export const mseValueOther = 'OTHER'
export const mseValueNotAssessed = 'NOT_ASSESSED'

export const mseIssueCodes = {
  value: 'VALUE_REQUIRED',
  details: 'DETAILS_REQUIRED',
}

const otherAndNotAssessed = [
  { value: mseValueOther, labelKey: 'mseOptOther' },
  { value: mseValueNotAssessed, labelKey: 'mseOptNotAssessed' },
]

function field(key, labelKey, options) {
  return {
    key,
    labelKey,
    options: [...options, ...otherAndNotAssessed],
  }
}

export const mseFields = [
  field('appearance', 'mseFieldAppearance', [
    { value: 'WELL_GROOMED', labelKey: 'mseOptWellGroomed' },
    { value: 'APPROPRIATE', labelKey: 'mseOptAppropriate' },
    { value: 'DISHEVELED', labelKey: 'mseOptDisheveled' },
    { value: 'POOR_HYGIENE', labelKey: 'mseOptPoorHygiene' },
  ]),
  field('behavior', 'mseFieldBehavior', [
    { value: 'COOPERATIVE', labelKey: 'mseOptCooperative' },
    { value: 'CALM', labelKey: 'mseOptCalm' },
    { value: 'GUARDED', labelKey: 'mseOptGuarded' },
    { value: 'AGITATED', labelKey: 'mseOptAgitated' },
    { value: 'RESTLESS', labelKey: 'mseOptRestless' },
    { value: 'WITHDRAWN', labelKey: 'mseOptWithdrawn' },
    { value: 'HOSTILE', labelKey: 'mseOptHostile' },
  ]),
  field('speech', 'mseFieldSpeech', [
    { value: 'NORMAL', labelKey: 'mseOptNormal' },
    { value: 'RAPID', labelKey: 'mseOptRapid' },
    { value: 'PRESSURED', labelKey: 'mseOptPressured' },
    { value: 'SLOW', labelKey: 'mseOptSlow' },
    { value: 'SOFT', labelKey: 'mseOptSoft' },
    { value: 'LOUD', labelKey: 'mseOptLoud' },
    { value: 'MINIMAL', labelKey: 'mseOptMinimal' },
    { value: 'MUTE', labelKey: 'mseOptMute' },
  ]),
  field('mood', 'mseFieldMood', [
    { value: 'EUTHYMIC', labelKey: 'mseOptEuthymic' },
    { value: 'ANXIOUS', labelKey: 'mseOptAnxious' },
    { value: 'DEPRESSED', labelKey: 'mseOptDepressed' },
    { value: 'IRRITABLE', labelKey: 'mseOptIrritable' },
    { value: 'ELEVATED', labelKey: 'mseOptElevated' },
    { value: 'ANGRY', labelKey: 'mseOptAngry' },
    { value: 'SAD', labelKey: 'mseOptSad' },
  ]),
  field('affect', 'mseFieldAffect', [
    { value: 'APPROPRIATE', labelKey: 'mseOptAppropriate' },
    { value: 'CONGRUENT', labelKey: 'mseOptCongruent' },
    { value: 'RESTRICTED', labelKey: 'mseOptRestricted' },
    { value: 'FLAT', labelKey: 'mseOptFlat' },
    { value: 'BLUNTED', labelKey: 'mseOptBlunted' },
    { value: 'LABILE', labelKey: 'mseOptLabile' },
  ]),
  field('thought_process', 'mseFieldThoughtProcess', [
    { value: 'LINEAR', labelKey: 'mseOptLinear' },
    { value: 'LOGICAL', labelKey: 'mseOptLogical' },
    { value: 'GOAL_DIRECTED', labelKey: 'mseOptGoalDirected' },
    { value: 'CIRCUMSTANTIAL', labelKey: 'mseOptCircumstantial' },
    { value: 'TANGENTIAL', labelKey: 'mseOptTangential' },
    { value: 'DISORGANIZED', labelKey: 'mseOptDisorganized' },
    { value: 'FLIGHT_OF_IDEAS', labelKey: 'mseOptFlightOfIdeas' },
  ]),
  field('thought_content', 'mseFieldThoughtContent', [
    { value: 'APPROPRIATE', labelKey: 'mseOptAppropriate' },
    { value: 'SUICIDAL_IDEATION', labelKey: 'mseOptSuicidalIdeation' },
    { value: 'HOMICIDAL_IDEATION', labelKey: 'mseOptHomicidalIdeation' },
    { value: 'DELUSIONAL', labelKey: 'mseOptDelusional' },
    { value: 'OBSESSIVE', labelKey: 'mseOptObsessive' },
    { value: 'PARANOID', labelKey: 'mseOptParanoid' },
  ]),
  field('perception', 'mseFieldPerception', [
    {
      value: 'NO_PERCEPTUAL_DISTURBANCE',
      labelKey: 'mseOptNoPerceptualDisturbance',
    },
    {
      value: 'AUDITORY_HALLUCINATIONS',
      labelKey: 'mseOptAuditoryHallucinations',
    },
    {
      value: 'VISUAL_HALLUCINATIONS',
      labelKey: 'mseOptVisualHallucinations',
    },
    {
      value: 'OTHER_HALLUCINATIONS',
      labelKey: 'mseOptOtherHallucinations',
    },
  ]),
  field('orientation', 'mseFieldOrientation', [
    { value: 'ORIENTED_X4', labelKey: 'mseOptOrientedX4' },
    { value: 'ORIENTED_X3', labelKey: 'mseOptOrientedX3' },
    { value: 'PARTIALLY_ORIENTED', labelKey: 'mseOptPartiallyOriented' },
    { value: 'DISORIENTED', labelKey: 'mseOptDisoriented' },
  ]),
  field('attention_concentration', 'mseFieldAttention', [
    { value: 'INTACT', labelKey: 'mseOptIntact' },
    { value: 'MILDLY_IMPAIRED', labelKey: 'mseOptMildlyImpaired' },
    { value: 'IMPAIRED', labelKey: 'mseOptImpaired' },
  ]),
  field('memory', 'mseFieldMemory', [
    { value: 'INTACT', labelKey: 'mseOptIntact' },
    {
      value: 'RECENT_MEMORY_IMPAIRED',
      labelKey: 'mseOptRecentMemoryImpaired',
    },
    {
      value: 'REMOTE_MEMORY_IMPAIRED',
      labelKey: 'mseOptRemoteMemoryImpaired',
    },
    {
      value: 'RECENT_AND_REMOTE_MEMORY_IMPAIRED',
      labelKey: 'mseOptRecentAndRemoteImpaired',
    },
  ]),
  field('insight', 'mseFieldInsight', [
    { value: 'GOOD', labelKey: 'mseOptGood' },
    { value: 'FAIR', labelKey: 'mseOptFair' },
    { value: 'POOR', labelKey: 'mseOptPoor' },
  ]),
  field('judgment', 'mseFieldJudgment', [
    { value: 'GOOD', labelKey: 'mseOptGood' },
    { value: 'FAIR', labelKey: 'mseOptFair' },
    { value: 'POOR', labelKey: 'mseOptPoor' },
  ]),
]

function parseJsonObject(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw
  }
  if (typeof raw !== 'string' || !raw.trim()) {
    return {}
  }
  try {
    const parsed = JSON.parse(raw)

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {}
  } catch {
    return {}
  }
}

function allowedValues(field) {
  return new Set((field?.options || []).map(option => option.value))
}

function normalizeValue(raw, field) {
  let token = String(raw || '').trim().toUpperCase().replace(/ /g, '_')
  if (token === 'ORIENTED_X_4' || token === 'ORIENTED_×4') {
    token = 'ORIENTED_X4'
  }
  if (token === 'ORIENTED_X_3' || token === 'ORIENTED_×3') {
    token = 'ORIENTED_X3'
  }

  return allowedValues(field).has(token) ? token : null
}

export function isMentalStatusExamSection(field) {
  const key = String(field?.fieldKey || field?.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
  if (key === 'mental_status_exam'
    || key === 'mental_status_examination'
    || key === 'mse') {
    return true
  }
  const parsed = parseJsonObject(
    field?.configurationJson ?? field?.configuration_json,
  )
  const token = String(parsed.definition || '').trim().toUpperCase()

  return token === mentalStatusExamDefinition
}

export function emptyMseValues() {
  const values = {}
  mseFields.forEach(item => {
    values[item.key] = { value: null, details: '' }
  })

  return values
}

export function parseMentalStatusExamValues(raw) {
  const parsed = parseJsonObject(raw)
  const source = parsed.values && typeof parsed.values === 'object'
    ? parsed.values
    : parsed
  const values = emptyMseValues()
  mseFields.forEach(item => {
    const row = source[item.key]
    if (!row || typeof row !== 'object') {
      return
    }
    values[item.key] = {
      value: normalizeValue(row.value, item),
      details: String(row.details ?? ''),
    }
  })

  return values
}

export function serializeMentalStatusExamValues(values) {
  const next = {}
  mseFields.forEach(item => {
    const row = values?.[item.key] || {}
    const value = normalizeValue(row.value, item)
    const details = String(row.details ?? '')
    if (!value && !details) {
      return
    }
    const payload = {}
    if (value) {
      payload.value = value
    }
    if (details) {
      payload.details = details
    }
    next[item.key] = payload
  })

  return JSON.stringify({
    section: mentalStatusExamDefinition,
    values: next,
  })
}

export function mseNeedsDetails(value) {
  return value === mseValueOther
}

export function mseIssues(values, required) {
  const issues = []
  mseFields.forEach(item => {
    const row = values?.[item.key] || {}
    const value = normalizeValue(row.value, item)
    const details = String(row.details || '').trim()
    if (!value) {
      if (required) {
        issues.push({
          key: item.key,
          labelKey: item.labelKey,
          code: mseIssueCodes.value,
        })
      }

      return
    }
    if (value === mseValueOther && !details) {
      issues.push({
        key: item.key,
        labelKey: item.labelKey,
        code: mseIssueCodes.details,
      })
    }
  })

  return issues
}

export function mseAnsweredCount(values) {
  return mseFields.filter(item => {
    const row = values?.[item.key] || {}
    const value = normalizeValue(row.value, item)
    if (!value) {
      return false
    }
    if (value === mseValueOther && !String(row.details || '').trim()) {
      return false
    }

    return true
  }).length
}

export function mseFieldOptions(field, t) {
  const options = [
    { label: t('mseSelect'), value: '' },
  ]
  ;(field?.options || []).forEach(option => {
    options.push({
      label: t(option.labelKey),
      value: option.value,
    })
  })

  return options
}
