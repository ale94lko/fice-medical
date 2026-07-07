export const staffListColumnKeys = {
  staffNo: 'staffNo',
  name: 'name',
  email: 'email',
  position: 'position',
  role: 'role',
  username: 'username',
  status: 'status',
  clinician: 'clinician',
  hireDate: 'hireDate',
  actions: 'actions',
}

export const staffFieldKeys = {
  staffNo: 'staffNo',
  name: 'name',
  email: 'email',
  position: 'position',
  role: 'role',
  status: 'status',
  isClinician: 'isClinician',
  hireDate: 'hireDate',
  username: 'username',
  npi: 'npi',
}

export const defaultStaffListColumnOrder = [
  staffListColumnKeys.staffNo,
  staffListColumnKeys.name,
  staffListColumnKeys.email,
  staffListColumnKeys.position,
  staffListColumnKeys.role,
  staffListColumnKeys.username,
  staffListColumnKeys.status,
  staffListColumnKeys.clinician,
  staffListColumnKeys.hireDate,
  staffListColumnKeys.actions,
]

export const requiredStaffListColumns = [
  staffListColumnKeys.staffNo,
  staffListColumnKeys.name,
  staffListColumnKeys.actions,
]

export const lockedStaffListColumns = [
  staffListColumnKeys.staffNo,
  staffListColumnKeys.actions,
]
