import { assessmentFieldTypes } from 'components/constants.js'
import {
  findOptionByStoredValue,
  optionValue,
} from 'src/utils/assessment-template-metadata.js'

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
    map[questionId] = item?.value ?? ''
  }

  return map
}

export function isAnswerEmpty(value, fieldType) {
  if (value === null || value === undefined) {
    return true
  }
  if (fieldType === assessmentFieldTypes.chips && Array.isArray(value)) {
    return value.length === 0
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
  const list = Array.isArray(current) ? [...current] : []
  const idx = list.findIndex(
    item => item === token
      || item === optionValue(findOptionByStoredValue(questionOptions, item)),
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
  if (!Array.isArray(current)) {
    return false
  }

  return current.some(
    item => item === token
      || optionValue(findOptionByStoredValue(questionOptions, item))
        === token,
  )
}
