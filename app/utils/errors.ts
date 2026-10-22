import { SimpleErrorReporter } from '@vinejs/vine'
import { fieldContext } from '@vinejs/vine/factories'

export const createFieldError = (fieldName: string, value: string, message: string) => {
  const errorReporter = new SimpleErrorReporter()
  errorReporter.report(message, fieldName, fieldContext.create(fieldName, value))
  errorReporter.report(value, `old_${fieldName}`, fieldContext.create(`old_${fieldName}`, value))

  return errorReporter.createError()
}
