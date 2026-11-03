import { SimpleErrorReporter } from '@vinejs/vine'
import { fieldContext } from '@vinejs/vine/factories'

export const createFieldError = (fieldName: string, value: string, message: string) => {
  const errorReporter = new SimpleErrorReporter()
  errorReporter.report(message, 'custom', fieldContext.create(fieldName, value))
  errorReporter.report(value, 'custom', fieldContext.create(`old_${fieldName}`, value))

  return errorReporter.createError()
}
