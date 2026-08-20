/* eslint-disable camelcase -- API tokens and payload keys use snake_case */
export const socialHistoryFieldKeys = {
  tobacco: 'tobacco',
  alcohol: 'alcohol',
  substance: 'substance',
  caffeine: 'caffeine',
  employment: 'employment',
  diet: 'diet',
}

function option(value, labelKey, needsNotes) {
  return { value, labelKey, needsNotes }
}

export const socialHistoryFields = [
  {
    key: socialHistoryFieldKeys.tobacco,
    statusKey: 'tobaccoStatus',
    notesKey: 'tobaccoNotes',
    labelKey: 'fmhSocialTobacco',
    options: [
      option('never_smoker', 'fmhSocialTobaccoNever', false),
      option('current_smoker', 'fmhSocialTobaccoCurrent', true),
      option('former_smoker', 'fmhSocialTobaccoFormer', true),
      option(
        'current_smokeless_tobacco_user',
        'fmhSocialTobaccoCurrentSmokeless',
        true,
      ),
      option(
        'former_smokeless_tobacco_user',
        'fmhSocialTobaccoFormerSmokeless',
        true,
      ),
      option('other_tobacco_use', 'fmhSocialTobaccoOther', true),
      option('unknown', 'fmhSocialUnknown', false),
    ],
    notePlaceholders: {
      current_smoker: 'fmhSocialTobaccoNotesCurrent',
      former_smoker: 'fmhSocialTobaccoNotesFormer',
      current_smokeless_tobacco_user: 'fmhSocialTobaccoNotesSmokeless',
      former_smokeless_tobacco_user: 'fmhSocialTobaccoNotesSmokeless',
      other_tobacco_use: 'fmhSocialTobaccoNotesOther',
      default: 'fmhSocialTobaccoNotesDefault',
    },
  },
  {
    key: socialHistoryFieldKeys.alcohol,
    statusKey: 'alcoholStatus',
    notesKey: 'alcoholNotes',
    labelKey: 'fmhSocialAlcohol',
    options: [
      option('never_no_alcohol_use', 'fmhSocialAlcoholNever', false),
      option('current_alcohol_use', 'fmhSocialAlcoholCurrent', true),
      option('social_alcohol_use', 'fmhSocialAlcoholSocial', true),
      option('former_alcohol_use', 'fmhSocialAlcoholFormer', true),
      option('other', 'fmhSocialAlcoholOther', true),
      option('unknown', 'fmhSocialUnknown', false),
    ],
    notePlaceholders: {
      current_alcohol_use: 'fmhSocialAlcoholNotesCurrent',
      social_alcohol_use: 'fmhSocialAlcoholNotesSocial',
      former_alcohol_use: 'fmhSocialAlcoholNotesFormer',
      other: 'fmhSocialAlcoholNotesOther',
      default: 'fmhSocialAlcoholNotesDefault',
    },
  },
  {
    key: socialHistoryFieldKeys.substance,
    statusKey: 'substanceStatus',
    notesKey: 'substanceNotes',
    labelKey: 'fmhSocialSubstance',
    options: [
      option(
        'never_no_illicit_drug_use',
        'fmhSocialSubstanceNever',
        false,
      ),
      option('current_use', 'fmhSocialSubstanceCurrent', true),
      option('former_use', 'fmhSocialSubstanceFormer', true),
      option('other', 'fmhSocialSubstanceOther', true),
      option('unknown', 'fmhSocialUnknown', false),
    ],
    notePlaceholders: {
      current_use: 'fmhSocialSubstanceNotesCurrent',
      former_use: 'fmhSocialSubstanceNotesFormer',
      other: 'fmhSocialSubstanceNotesOther',
      default: 'fmhSocialSubstanceNotesDefault',
    },
  },
  {
    key: socialHistoryFieldKeys.caffeine,
    statusKey: 'caffeineStatus',
    notesKey: 'caffeineNotes',
    labelKey: 'fmhSocialCaffeine',
    options: [
      option('no_caffeine_use', 'fmhSocialCaffeineNone', false),
      option('uses_caffeine', 'fmhSocialCaffeineUses', true),
      option('former_caffeine_use', 'fmhSocialCaffeineFormer', true),
      option('unknown', 'fmhSocialUnknown', false),
    ],
    notePlaceholders: {
      uses_caffeine: 'fmhSocialCaffeineNotesUses',
      former_caffeine_use: 'fmhSocialCaffeineNotesFormer',
      default: 'fmhSocialCaffeineNotesDefault',
    },
  },
  {
    key: socialHistoryFieldKeys.employment,
    statusKey: 'employmentStatus',
    notesKey: 'employmentNotes',
    labelKey: 'fmhSocialEmployment',
    options: [
      option('employed', 'fmhSocialEmploymentEmployed', true),
      option('self_employed', 'fmhSocialEmploymentSelf', true),
      option('unemployed', 'fmhSocialEmploymentUnemployed', false),
      option('student', 'fmhSocialEmploymentStudent', true),
      option('retired', 'fmhSocialEmploymentRetired', false),
      option(
        'disabled_unable_to_work',
        'fmhSocialEmploymentDisabled',
        true,
      ),
      option('homemaker', 'fmhSocialEmploymentHomemaker', false),
      option('other', 'fmhSocialEmploymentOther', true),
      option('unknown', 'fmhSocialUnknown', false),
    ],
    notePlaceholders: {
      employed: 'fmhSocialEmploymentNotesEmployed',
      self_employed: 'fmhSocialEmploymentNotesSelf',
      student: 'fmhSocialEmploymentNotesStudent',
      disabled_unable_to_work: 'fmhSocialEmploymentNotesDisabled',
      other: 'fmhSocialEmploymentNotesOther',
      default: 'fmhSocialEmploymentNotesDefault',
    },
  },
  {
    key: socialHistoryFieldKeys.diet,
    statusKey: 'dietStatus',
    notesKey: 'dietNotes',
    labelKey: 'fmhSocialDiet',
    options: [
      option(
        'regular_diet_no_restrictions',
        'fmhSocialDietRegular',
        false,
      ),
      option('vegetarian', 'fmhSocialDietVegetarian', true),
      option('vegan', 'fmhSocialDietVegan', true),
      option(
        'therapeutic_medically_prescribed_diet',
        'fmhSocialDietTherapeutic',
        true,
      ),
      option('restricted_diet', 'fmhSocialDietRestricted', true),
      option('other', 'fmhSocialDietOther', true),
      option('unknown', 'fmhSocialUnknown', false),
    ],
    notePlaceholders: {
      vegetarian: 'fmhSocialDietNotesVegetarian',
      vegan: 'fmhSocialDietNotesVegan',
      therapeutic_medically_prescribed_diet:
        'fmhSocialDietNotesTherapeutic',
      restricted_diet: 'fmhSocialDietNotesRestricted',
      other: 'fmhSocialDietNotesOther',
      default: 'fmhSocialDietNotesDefault',
    },
  },
]

export function createEmptySocialHistory() {
  return {
    tobaccoStatus: null,
    tobaccoNotes: '',
    alcoholStatus: null,
    alcoholNotes: '',
    substanceStatus: null,
    substanceNotes: '',
    caffeineStatus: null,
    caffeineNotes: '',
    employmentStatus: null,
    employmentNotes: '',
    dietStatus: null,
    dietNotes: '',
  }
}

function trimSocial(value) {
  if (value == null) {
    return ''
  }

  return String(value).trim()
}

function optionFor(field, status) {
  const token = trimSocial(status)
  if (!token) {
    return null
  }

  return field.options.find(item => item.value === token) ?? null
}

export function socialFieldNeedsNotes(field, status) {
  return Boolean(optionFor(field, status)?.needsNotes)
}

export function socialNotesPlaceholderKey(field, status) {
  const token = trimSocial(status)
  if (!token) {
    return field.notePlaceholders.default
  }

  return field.notePlaceholders[token] || field.notePlaceholders.default
}

export function applySocialStatusChange(socialHistory, field, status) {
  const next = {
    ...socialHistory,
    [field.statusKey]: status || null,
  }
  if (!socialFieldNeedsNotes(field, status)) {
    next[field.notesKey] = ''
  }

  return next
}

export function socialHistoryHasData(socialHistory) {
  const row = socialHistory ?? {}

  return socialHistoryFields.some(field =>
    trimSocial(row[field.statusKey]) || trimSocial(row[field.notesKey]),
  )
}

function statusFromApi(raw) {
  const token = trimSocial(raw)
  if (!token) {
    return null
  }

  return token
}

export function mapSocialHistoryFromApi(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const empty = createEmptySocialHistory()

  return {
    tobaccoStatus: statusFromApi(
      source.tobacco_status ?? source.tobaccoStatus,
    ) ?? empty.tobaccoStatus,
    tobaccoNotes: trimSocial(
      source.tobacco_notes ?? source.tobaccoNotes,
    ),
    alcoholStatus: statusFromApi(
      source.alcohol_status ?? source.alcoholStatus,
    ) ?? empty.alcoholStatus,
    alcoholNotes: trimSocial(
      source.alcohol_notes ?? source.alcoholNotes,
    ),
    substanceStatus: statusFromApi(
      source.substance_status ?? source.substanceStatus,
    ) ?? empty.substanceStatus,
    substanceNotes: trimSocial(
      source.substance_notes ?? source.substanceNotes,
    ),
    caffeineStatus: statusFromApi(
      source.caffeine_status ?? source.caffeineStatus,
    ) ?? empty.caffeineStatus,
    caffeineNotes: trimSocial(
      source.caffeine_notes ?? source.caffeineNotes,
    ),
    employmentStatus: statusFromApi(
      source.employment_status ?? source.employmentStatus,
    ) ?? empty.employmentStatus,
    employmentNotes: trimSocial(
      source.employment_notes ?? source.employmentNotes,
    ),
    dietStatus: statusFromApi(
      source.diet_status ?? source.dietStatus,
    ) ?? empty.dietStatus,
    dietNotes: trimSocial(
      source.diet_notes ?? source.dietNotes,
    ),
  }
}

function notesForPayload(field, row) {
  if (!field) {
    return null
  }
  const status = row[field.statusKey]
  if (!socialFieldNeedsNotes(field, status)) {
    return null
  }

  return trimSocial(row[field.notesKey]) || null
}

export function buildSocialHistoryPayload(socialHistory) {
  const row = {
    ...createEmptySocialHistory(),
    ...(socialHistory ?? {}),
  }

  return {
    tobacco_status: statusFromApi(row.tobaccoStatus),
    tobacco_notes: notesForPayload(
      socialHistoryFields.find(item => item.key === 'tobacco'),
      row,
    ),
    alcohol_status: statusFromApi(row.alcoholStatus),
    alcohol_notes: notesForPayload(
      socialHistoryFields.find(item => item.key === 'alcohol'),
      row,
    ),
    substance_status: statusFromApi(row.substanceStatus),
    substance_notes: notesForPayload(
      socialHistoryFields.find(item => item.key === 'substance'),
      row,
    ),
    caffeine_status: statusFromApi(row.caffeineStatus),
    caffeine_notes: notesForPayload(
      socialHistoryFields.find(item => item.key === 'caffeine'),
      row,
    ),
    employment_status: statusFromApi(row.employmentStatus),
    employment_notes: notesForPayload(
      socialHistoryFields.find(item => item.key === 'employment'),
      row,
    ),
    diet_status: statusFromApi(row.dietStatus),
    diet_notes: notesForPayload(
      socialHistoryFields.find(item => item.key === 'diet'),
      row,
    ),
  }
}
