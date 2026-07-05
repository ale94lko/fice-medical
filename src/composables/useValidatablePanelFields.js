import { nextTick } from 'vue'

export async function validateFields(fields) {
  const list = fields.filter(Boolean)
  for (const field of list) {
    field.resetValidation?.()
  }
  await nextTick()
  for (const field of list) {
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
