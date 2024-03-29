export { toDisplayString } from './toDisplayString'

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

export const EMPTY_ARR = []

export const hasChanged = (value: unknown, oldValue: unknown): boolean =>
  !Object.is(value, oldValue)

export const isArray = Array.isArray

export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'

export const extend = Object.assign

export const EMPTY_OBJ: { readonly [key: string]: any } = {}

export const NOOP: () => void = () => {}

export const objectToString = Object.prototype.toString

export const toTypeString = (value: unknown): string =>
  objectToString.call(value)

export const isSet: (val: unknown) => val is Set<any> = (
  val: unknown
): val is Set<any> => toTypeString(val) === '[object Set]'

export const isMap: (val: unknown) => val is Map<any, any> = (
  val: unknown
): val is Map<any, any> => toTypeString(val) === '[object Map]'

export const isPlainObject: (val: unknown) => val is object = (
  val: unknown
): val is object => toTypeString(val) === '[object Object]'

export const isString: (val: unknown) => val is string = (
  val: unknown
): val is string => typeof val === 'string'

const onRE = /^on[^a-z]/
export const isStartsWithOn = (str: string): boolean => onRE.test(str)

export const camelize = (str: string): string =>
  str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1)

export const invokeArrayFns = (fns: Function[], arg?: any): void => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg)
  }
}

export const startsWith = (str: string, searchString: string): boolean =>
  str.startsWith(searchString)
