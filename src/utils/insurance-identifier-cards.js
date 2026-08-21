/* eslint-disable camelcase -- API identifier_cards payload uses snake_case */
import {
  insuranceCardFileIdForApi,
  resolveInsuranceCardAttachment,
} from 'src/utils/insurance-card-file.js'

export const INSURANCE_IDENTIFIER_CARD_KINDS = {
  MEMBER: 'MEMBER',
  MEDICAID: 'MEDICAID',
  MEDICARE: 'MEDICARE',
  GOLDEN_CARD: 'GOLDEN_CARD',
  OTHER: 'OTHER',
}

export const INSURANCE_IDENTIFIER_CARD_KIND_ORDER = [
  INSURANCE_IDENTIFIER_CARD_KINDS.MEMBER,
  INSURANCE_IDENTIFIER_CARD_KINDS.MEDICAID,
  INSURANCE_IDENTIFIER_CARD_KINDS.MEDICARE,
  INSURANCE_IDENTIFIER_CARD_KINDS.GOLDEN_CARD,
  INSURANCE_IDENTIFIER_CARD_KINDS.OTHER,
]

function trimId(value) {
  return String(value ?? '').trim()
}

export function createEmptyCardFilesByKind() {
  return {
    [INSURANCE_IDENTIFIER_CARD_KINDS.MEMBER]: {
      front: null,
      back: null,
    },
    [INSURANCE_IDENTIFIER_CARD_KINDS.MEDICAID]: {
      front: null,
      back: null,
    },
    [INSURANCE_IDENTIFIER_CARD_KINDS.MEDICARE]: {
      front: null,
      back: null,
    },
    [INSURANCE_IDENTIFIER_CARD_KINDS.GOLDEN_CARD]: {
      front: null,
      back: null,
    },
    [INSURANCE_IDENTIFIER_CARD_KINDS.OTHER]: {
      front: null,
      back: null,
    },
  }
}

export function cloneCardFilesByKind(raw) {
  const next = createEmptyCardFilesByKind()
  const source = raw?.cardFilesByKind
  if (!source || typeof source !== 'object') {
    next.MEMBER = {
      front: raw?.frontCardFile ?? null,
      back: raw?.backCardFile ?? null,
    }

    return next
  }
  for (const kind of INSURANCE_IDENTIFIER_CARD_KIND_ORDER) {
    next[kind] = {
      front: source[kind]?.front ?? null,
      back: source[kind]?.back ?? null,
    }
  }
  if (!next.MEMBER.front && !next.MEMBER.back) {
    next.MEMBER = {
      front: raw?.frontCardFile ?? null,
      back: raw?.backCardFile ?? null,
    }
  }

  return next
}

export function insuranceCardTabsFromProfile(profile, labels = {}) {
  const sources = [
    {
      kind: INSURANCE_IDENTIFIER_CARD_KINDS.MEMBER,
      always: true,
      value: profile?.memberId,
    },
    {
      kind: INSURANCE_IDENTIFIER_CARD_KINDS.MEDICAID,
      always: false,
      value: profile?.medicaidRecipientId,
    },
    {
      kind: INSURANCE_IDENTIFIER_CARD_KINDS.MEDICARE,
      always: false,
      value: profile?.medicareMemberId,
    },
    {
      kind: INSURANCE_IDENTIFIER_CARD_KINDS.GOLDEN_CARD,
      always: false,
      value: profile?.goldenCardMemberId,
    },
    {
      kind: INSURANCE_IDENTIFIER_CARD_KINDS.OTHER,
      always: false,
      value: profile?.otherInsuranceId,
    },
  ]

  return sources
    .filter(item => item.always || Boolean(trimId(item.value)))
    .map(item => ({
      kind: item.kind,
      label: labels[item.kind] || item.kind,
    }))
}

export function identifierCardsForApi(profile) {
  const files = profile?.cardFilesByKind ?? createEmptyCardFilesByKind()

  return insuranceCardTabsFromProfile(profile).map(tab => {
    const pair = files[tab.kind] ?? {}
    let front = pair.front
    let back = pair.back
    if (tab.kind === INSURANCE_IDENTIFIER_CARD_KINDS.MEMBER) {
      front = front ?? profile?.frontCardFile
      back = back ?? profile?.backCardFile
    }

    return {
      kind: tab.kind,
      front_card_file_id: insuranceCardFileIdForApi(front),
      back_card_file_id: insuranceCardFileIdForApi(back),
    }
  })
}

export function mapCardFilesByKindFromApi(row, mapAttachment) {
  const next = createEmptyCardFilesByKind()
  const mapFile = typeof mapAttachment === 'function'
    ? mapAttachment
    : () => null
  const cards = row?.identifier_cards ?? row?.identifierCards
  if (Array.isArray(cards)) {
    cards.forEach(card => {
      const kind = String(card?.kind ?? '').trim().toUpperCase()
      if (!next[kind]) {
        return
      }
      next[kind] = {
        front: mapFile(
          card?.front_card_file_id ?? card?.frontCardFileId,
          card?.front_card_file ?? card?.frontCardFile,
        ),
        back: mapFile(
          card?.back_card_file_id ?? card?.backCardFileId,
          card?.back_card_file ?? card?.backCardFile,
        ),
      }
    })
  }
  if (!next.MEMBER.front && !next.MEMBER.back) {
    next.MEMBER = {
      front: mapFile(
        row?.front_card_file_id ?? row?.frontCardFileId,
        row?.front_card_file ?? row?.frontCardFile,
      ),
      back: mapFile(
        row?.back_card_file_id ?? row?.backCardFileId,
        row?.back_card_file ?? row?.backCardFile,
      ),
    }
  }

  return next
}

export function setCardFileOnProfile(profile, kind, side, value) {
  if (!profile || !kind) {
    return
  }
  if (side !== 'front' && side !== 'back') {
    return
  }
  const files = profile.cardFilesByKind ?? createEmptyCardFilesByKind()
  const pair = files[kind] ?? { front: null, back: null }
  files[kind] = {
    ...pair,
    [side]: value ?? null,
  }
  profile.cardFilesByKind = { ...files }
}

export function cardFileFromProfile(profile, kind, side) {
  return profile?.cardFilesByKind?.[kind]?.[side] ?? null
}

export async function resolveAllCardFilesByKind(
  cardFilesByKind,
  opts = {},
) {
  const next = createEmptyCardFilesByKind()
  await Promise.all(
    INSURANCE_IDENTIFIER_CARD_KIND_ORDER.map(async kind => {
      const pair = cardFilesByKind?.[kind] ?? {}
      const [front, back] = await Promise.all([
        resolveInsuranceCardAttachment(pair.front, opts),
        resolveInsuranceCardAttachment(pair.back, opts),
      ])
      next[kind] = { front, back }
    }),
  )

  return next
}
