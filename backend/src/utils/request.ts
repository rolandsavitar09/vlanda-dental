import { ApiError } from '../middleware/error.js'

export const getParam = (value: string | string[] | undefined, name: string) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, `Parameter ${name} tidak valid`)
  }

  return value
}
