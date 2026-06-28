import {
  clientEmailTypeValues,
  clientPhoneTypeValues,
} from 'components/constants.js'

export function phoneTypeSelectOptions() {
  return Object.values(clientPhoneTypeValues).map(value => ({
    label: value,
    value,
  }))
}

export function emailTypeSelectOptions() {
  return Object.values(clientEmailTypeValues).map(value => ({
    label: value,
    value,
  }))
}

function toSnakeToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

const PHONE_TYPE_FROM_API = {
  home: clientPhoneTypeValues.home,
  work: clientPhoneTypeValues.work,
  practice: clientPhoneTypeValues.work,
  mobile: clientPhoneTypeValues.mobile,
  cell: clientPhoneTypeValues.mobile,
  fax: clientPhoneTypeValues.fax,
  pager: clientPhoneTypeValues.pager,
  emergency: clientPhoneTypeValues.emergency,
}

const EMAIL_TYPE_FROM_API = {
  personal: clientEmailTypeValues.personal,
  work: clientEmailTypeValues.work,
  other: clientEmailTypeValues.other,
  billing: clientEmailTypeValues.billing,
}

export function mapPhoneTypeFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }

  return PHONE_TYPE_FROM_API[token] ?? ''
}

export function mapEmailTypeFromApi(value) {
  const token = toSnakeToken(value)

  return EMAIL_TYPE_FROM_API[token] ?? ''
}
