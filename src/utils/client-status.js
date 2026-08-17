import { clientStatuses } from 'components/constants.js'
import { adminTableStatusVariants } from 'src/constants/admin-table.js'

const clientStatusOptionDefs = [
  {
    value: clientStatuses.active,
    labelKey: 'active',
    variant: adminTableStatusVariants.active,
  },
  {
    value: clientStatuses.inactive,
    labelKey: 'inactive',
    variant: adminTableStatusVariants.inactive,
  },
  {
    value: clientStatuses.pending,
    labelKey: 'pending',
    variant: adminTableStatusVariants.pending,
  },
  {
    value: clientStatuses.discharged,
    labelKey: 'discharged',
    variant: adminTableStatusVariants.discharged,
  },
]

export function clientStatusOptions(t) {
  return clientStatusOptionDefs.map(item => ({
    value: item.value,
    label: t(item.labelKey),
    variant: item.variant,
  }))
}
