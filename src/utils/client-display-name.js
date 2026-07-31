import { clientFieldKeys as ck } from 'components/constants.js'
import {
  formatPersonDisplayName,
  formatPersonDisplayNameFromRecord,
} from 'src/utils/person-display-name.js'

/**
 * Client form / overview display name (canonical person format).
 */
export function formatClientDisplayName(
  form,
  {
    prefixSelectOptions = [],
    suffixSelectOptions = [],
  } = {},
) {
  return formatPersonDisplayName(
    {
      prefix: form?.[ck.prefix],
      firstName: form?.[ck.firstName],
      middleName: form?.[ck.middleName],
      lastName: form?.[ck.lastName],
      suffix: form?.[ck.suffix],
    },
    {
      prefixSelectOptions,
      suffixSelectOptions,
    },
  )
}

/**
 * Client list-view row name (same canonical format).
 */
export function formatClientListViewDisplayName(
  name,
  {
    prefixSelectOptions = [],
    suffixSelectOptions = [],
    prefix = '',
    suffix = '',
    firstName = '',
    middleName = '',
    lastName = '',
  } = {},
) {
  return formatPersonDisplayNameFromRecord(
    {
      prefix,
      firstName,
      middleName,
      lastName,
      suffix,
      name,
    },
    {
      prefixSelectOptions,
      suffixSelectOptions,
    },
    name,
  )
}
