import { isAnswerEmpty } from 'src/utils/screening-answers.js'
import { deriveScreeningRiskLevel } from 'src/utils/screening-scores.js'

function sectionHasRiskSignal(section, template, answersMap) {
  const title = String(section.title ?? '').toLowerCase()
  const isRiskSection = title.includes('risk') || title.includes('suicide')
  if (!isRiskSection) {
    return false
  }

  return deriveScreeningRiskLevel(
    { sections: [section] },
    answersMap,
  ) !== 'low'
}

export function getSectionCompletion(section, answersMap) {
  const questions = section?.questions ?? []
  if (!questions.length) {
    return { answered: 0, total: 0, requiredAnswered: 0, requiredTotal: 0 }
  }

  let answered = 0
  let requiredAnswered = 0
  let requiredTotal = 0

  for (const question of questions) {
    const empty = isAnswerEmpty(
      answersMap?.[question.id],
      question.fieldType,
    )
    if (!empty) {
      answered += 1
    }
    if (question.required) {
      requiredTotal += 1
      if (!empty) {
        requiredAnswered += 1
      }
    }
  }

  return {
    answered,
    total: questions.length,
    requiredAnswered,
    requiredTotal,
  }
}

/**
 * @returns {'complete'|'warning'|'in_progress'|'pending'}
 */
export function getSectionStatus(section, template, answersMap) {
  const completion = getSectionCompletion(section, answersMap)
  if (!completion.total) {
    return 'pending'
  }

  const requiredDone = completion.requiredTotal === 0
    || completion.requiredAnswered === completion.requiredTotal
  const anyAnswered = completion.answered > 0

  if (requiredDone && anyAnswered) {
    if (sectionHasRiskSignal(section, template, answersMap)) {
      return 'warning'
    }

    return 'complete'
  }

  if (anyAnswered) {
    if (sectionHasRiskSignal(section, template, answersMap)) {
      return 'warning'
    }

    return 'in_progress'
  }

  return 'pending'
}

export function buildSectionStatusList(template, answersMap) {
  return (template?.sections ?? []).map(section => ({
    id: section.id,
    title: section.title,
    status: getSectionStatus(section, template, answersMap),
    completion: getSectionCompletion(section, answersMap),
  }))
}
