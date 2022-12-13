export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

export const hasChanged = (value: unknown, oldValue: unknown): boolean =>
  !Object.is(value, oldValue)

export const isArray = Array.isArray

export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'
