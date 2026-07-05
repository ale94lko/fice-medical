export async function validateFields(fields) {
  for (const field of fields.filter(Boolean)) {
    if (typeof field.validate === 'function') {
      await field.validate()
    }
  }
}

export function clearFieldValidation(fields) {
  for (const field of fields.filter(Boolean)) {
    field.resetValidation?.()
  }
}
