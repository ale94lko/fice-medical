import {
  subtenantFieldKeys as fk,
  subtenantStatusValues,
} from 'components/constants.js'
import { clinicTypeLabel } from 'src/utils/clinic-type.js'

function parseOptionalPhotoFileId(item) {
  const value = item?.photo_file_id
    ?? item?.photoFileId
    ?? item?.photo_stored_file_id
    ?? item?.photoStoredFileId
  const id = Number(value)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  return id
}

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
    [fk.clinicType]: String(
      item.clinic_type ?? item.clinicType ?? '',
    ).trim(),
    clinicTypeLabel: clinicTypeLabel(
      t,
      item.clinic_type ?? item.clinicType,
    ),
    [fk.main]: Boolean(item.main),
    mainLabel: item.main ? t('yes') : t('no'),
    [fk.status]: status,
    statusLabel: isActive ? t('active') : t('inactive'),
    statusVariant: isActive ? 'active' : 'inactive',
    photoFileId: parseOptionalPhotoFileId(item),
  }
}
