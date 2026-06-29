import {
  subtenantFieldKeys as fk,
  subtenantStatusValues,
} from 'components/constants.js'

export function mapSubtenantListItem(item, t) {
  if (!item || item.id == null) {
    return null
  }

  const status = Number(item.status ?? subtenantStatusValues.inactive)
  const isActive = status === subtenantStatusValues.active

  return {
    id: item.id,
    [fk.name]: String(item.name ?? '').trim(),
    [fk.code]: String(item.code ?? '').trim(),
    [fk.main]: Boolean(item.main),
    mainLabel: item.main ? t('yes') : t('no'),
    [fk.status]: status,
    statusLabel: isActive ? t('active') : t('inactive'),
    statusVariant: isActive ? 'active' : 'inactive',
  }
}
