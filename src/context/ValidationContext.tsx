import { createContext, useContext } from 'react'

export const ValidationContext = createContext(false)

export function useShowValidation(): boolean {
  return useContext(ValidationContext)
}

export function isEmpty(value: string): boolean {
  return value.trim().length === 0
}

export function isRequiredInvalid(required: boolean | undefined, value: string, show: boolean): boolean {
  return Boolean(required && show && isEmpty(value))
}

export function fieldClass(invalid: boolean): string {
  return invalid ? 'form-field field-invalid' : 'form-field'
}
