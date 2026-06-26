import {
  findOptionByStoredValue,
  findQuestionByClinicalKey,
  optionClinicalScore,
  resolveAnswerClinicalValue,
} from 'src/utils/screening-template-metadata.js'
import { isAnswerEmpty } from 'src/utils/screening-answers.js'

const HIGH_RISK_LABELS = [
  'active ideation',
  'intent',
  'plan',
  'critical',
  'high',
]

const MODERATE_RISK_LABELS = [
  'passive ideation',
  'moderate',
]

export function calculateScreeningScore(template, answersMap) {
  let score = 0
  let maxScore = 0

  for (const section of template?.sections ?? []) {
    for (const question of section.questions ?? []) {
      const options = question.options ?? []
      const optionScores = options
        .map(option => optionClinicalScore(option))
        .filter(value => value != null)
      const questionMax = optionScores.length
        ? Math.max(...optionScores)
        : 0

      if (questionMax > 0) {
        maxScore += questionMax
      }

      const values = resolveAnswerClinicalValue(
        question,
        answersMap?.[question.id],
      )
      if (Array.isArray(values)) {
        score += values.reduce((sum, item) => sum + (item ?? 0), 0)
      } else if (values != null) {
        score += values
      }
    }
  }

  return { score, maxScore }
}

function labelRiskWeight(label) {
  const text = String(label ?? '').trim().toLowerCase()
  if (!text) {
    return 0
  }
  if (HIGH_RISK_LABELS.some(token => text.includes(token))) {
    return 3
  }
  if (MODERATE_RISK_LABELS.some(token => text.includes(token))) {
    return 2
  }

  return 0
}

function riskFromAnswer(question, answersMap) {
  const value = answersMap?.[question?.id]
  if (isAnswerEmpty(value, question?.fieldType)) {
    return 0
  }
  if (value === true || value === 'yes' || value === 'Yes') {
    return 2
  }
  const option = findOptionByStoredValue(question?.options ?? [], value)
  const score = optionClinicalScore(option)
  if (score != null && score >= 3) {
    return 3
  }
  if (score != null && score >= 2) {
    return 2
  }

  return labelRiskWeight(option?.label ?? value)
}

export function deriveScreeningRiskLevel(template, answersMap) {
  let weight = 0

  for (const section of template?.sections ?? []) {
    const title = String(section.title ?? '').toLowerCase()
    const isRiskSection = title.includes('risk')
      || title.includes('suicide')
      || section.clinicalMetadata?.clinicalKey === 'suicide_risk'

    for (const question of section.questions ?? []) {
      const clinicalKey = String(
        question.clinicalMetadata?.clinicalKey ?? '',
      ).toLowerCase()
      const label = String(question.label ?? '').toLowerCase()
      const isRiskQuestion = isRiskSection
        || clinicalKey.includes('risk')
        || clinicalKey.includes('suicide')
        || label.includes('suicidal')
        || label.includes('risk level')

      if (!isRiskQuestion) {
        continue
      }

      weight = Math.max(weight, riskFromAnswer(question, answersMap))
    }
  }

  const suicideQuestion = findQuestionByClinicalKey(template, 'suicide_risk')
  if (suicideQuestion?.question) {
    weight = Math.max(
      weight,
      riskFromAnswer(suicideQuestion.question, answersMap),
    )
  }

  if (weight >= 3) {
    return 'critical'
  }
  if (weight >= 2) {
    return 'moderate'
  }
  if (weight >= 1) {
    return 'low'
  }

  const { score, maxScore } = calculateScreeningScore(template, answersMap)
  if (maxScore > 0) {
    const ratio = score / maxScore
    if (ratio >= 0.75) {
      return 'high'
    }
    if (ratio >= 0.45) {
      return 'moderate'
    }
  }

  return 'low'
}
