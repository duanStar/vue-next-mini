import { activeEffect, trackEffects, triggerEffects } from './effect'
import { hasChanged } from '@vue/shared'
import { createDep, Dep } from './dep'
import { toRaw, toReactive } from './reactive'

export interface Ref<T = any> {
  __v_isRef: true
  value: T
}

type RefBase<T> = {
  dep?: Dep
  value: T
}

/**
 * 创建ref对象
 * @param value 原始值
 * @returns ref对象
 */
export function ref(value?: unknown) {
  return createRef(value, false)
}

/**
 * 收集依赖
 * @param ref ref对象
 */
export function trackRefValue(ref: RefBase<any>) {
  if (activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}

/**
 * 触发依赖
 * @param ref ref对象
 */
export function triggerRefValue(ref: RefBase<any>) {
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}

/**
 * 创建ref对象
 * @param rawValue 原始值
 * @param isShallow 是否是浅层代理
 * @returns ref对象
 */
function createRef(rawValue: unknown, isShallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, isShallow)
}

/**
 * 判断是否是ref对象
 * @param r ref对象
 * @returns 是否是ref对象
 */
export function isRef(r: any): r is Ref {
  return Boolean(r && r.__v_isRef === true)
}

/**
 * ref对象的实现
 */
class RefImpl<T> {
  // 原始值
  private _rawValue: T
  // 代理后的值
  private _value: T

  public __v_isRef: boolean = true
  public dep?: Dep = undefined
  constructor(value: T, public __v_isShallow: boolean) {
    this._rawValue = __v_isShallow ? value : toRaw(value)
    this._value = __v_isShallow ? value : toReactive(value)
  }

  get value(): T {
    trackRefValue(this)
    return this._value
  }
  set value(newVal: T) {
    newVal = this.__v_isShallow ? newVal : toRaw(newVal)
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      this._value = this.__v_isShallow ? newVal : toReactive(newVal)
      triggerRefValue(this)
    }
  }
}
