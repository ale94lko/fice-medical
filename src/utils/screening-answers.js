import { screeningFieldTypes } from 'components/constants.js'
import {
  findOptionByStoredValue,
  optionValue,
} from 'src/utils/screening-template-metadata.js'

export function createEmptyAnswersMap() {
  return {}
}

export function answersArrayFromMap(answersMap) {
  return Object.entries(answersMap ?? {})
    .filter(([questionId]) => String(questionId).trim())
    .map(([questionId, value]) => ({
      questionId: String(questionId).trim(),
      value,
    }))
}

export function answersMapFromArray(answers) {
  const map = createEmptyAnswersMap()
  for (const item of answers ?? []) {
    const questionId = String(
      item?.question_id ?? item?.questionId ?? '',
    ).trim()
    if (!questionId) {
      continue
    }
    map[questionId] = normalizeAnswerValue(item?.value)
  }

  return map
}

/**
 * Normalizes API/UI answer values. CHIPS may arrive as string[] from API.
 * Legacy comma-joined strings are split for chips UI compatibility.
 */
export function normalizeAnswerValue(value) {
  if (value === null || value === undefined) {
    return ''
  }
  if (Array.isArray(value)) {
    return value
      .map(item => String(item ?? '').trim())
      .filter(Boolean)
  }
  if (typeof value === 'boolean') {
    return value
  }

  return value
}

export function coerceChipAnswerList(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item ?? '').trim())
      .filter(Boolean)
  }
  const raw = String(value ?? '').trim()
  if (!raw) {
    return []
  }
  if (raw.includes(', ')) {
    return raw.split(', ').map(part => part.trim()).filter(Boolean)
  }

  return [raw]
}

export function isAnswerEmpty(value, fieldType) {
  if (value === null || value === undefined) {
    return true
  }
  if (fieldType === screeningFieldTypes.chips) {
    return coerceChipAnswerList(value).length === 0
  }
  if (typeof value === 'boolean') {
    return false
  }

  return String(value).trim() === ''
}

export function validateRequiredAnswers(template, answersMap) {
  const errors = {}
  for (const section of template?.sections ?? []) {
    for (const question of section.questions ?? []) {
      if (!question.required) {
        continue
      }
      const value = answersMap?.[question.id]
      if (isAnswerEmpty(value, question.fieldType)) {
        errors[question.id] = true
      }
    }
  }

  return errors
}

export function countAnsweredQuestions(template, answersMap) {
  let total = 0
  let answered = 0
  for (const section of template?.sections ?? []) {
    for (const question of section.questions ?? []) {
      total += 1
      if (!isAnswerEmpty(answersMap?.[question.id], question.fieldType)) {
        answered += 1
      }
    }
  }

  return { total, answered }
}

export function toggleChipAnswer(current, option, questionOptions) {
  const token = optionValue(option)
  const list = [...coerceChipAnswerList(current)]
  const idx = list.findIndex(
    item => item === token
      || optionValue(findOptionByStoredValue(questionOptions, item)) === token,
  )
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(token)
  }

  return list
}

export function isChipSelected(current, option, questionOptions) {
  const token = optionValue(option)
  const list = coerceChipAnswerList(current)

  return list.some(
    item => item === token
      || optionValue(findOptionByStoredValue(questionOptions, item))
        === token,
  )
}
