export const IANA_TIMEZONE_OPTIONS = [
  { label: 'America/New_York (Eastern)', value: 'America/New_York' },
  { label: 'America/Chicago (Central)', value: 'America/Chicago' },
  { label: 'America/Denver (Mountain)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (Pacific)', value: 'America/Los_Angeles' },
  { label: 'America/Phoenix (Arizona)', value: 'America/Phoenix' },
  { label: 'America/Anchorage (Alaska)', value: 'America/Anchorage' },
  { label: 'Pacific/Honolulu (Hawaii)', value: 'Pacific/Honolulu' },
  { label: 'UTC', value: 'UTC' },
]

export const DATE_FORMAT_OPTIONS = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
]

export const TIME_FORMAT_VALUES = {
  h12: '12h',
  h24: '24h',
}

export const FIRST_DAY_VALUES = {
  sunday: 'SUNDAY',
  monday: 'MONDAY',
}

export function ianaTimezoneSelectOptions(currentValue) {
  const options = IANA_TIMEZONE_OPTIONS.map(row => ({ ...row }))
  const current = String(currentValue ?? '').trim()
  if (current && !options.some(row => row.value === current)) {
    options.unshift({ label: current, value: current })
  }

  return options
}
