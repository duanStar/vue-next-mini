import { isFunction } from '@vue/shared'
import { Dep } from './dep'
import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'

export type ComputedGetter<T> = (...args: any[]) => T
export type ComputedSetter<T> = (value: T) => void

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>
  set: ComputedSetter<T>
}

/**
 * 创建计算属性
 * @param getter 计算属性的getter函数或者配置项
 */
export function computed<T>(getter: ComputedGetter<T>): ComputedRefImpl<T>
export function computed<T>(
  options: WritableComputedOptions<T>
): ComputedRefImpl<T>
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>
  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    setter = () => {}
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedRefImpl<T>(getter, setter)
}

/**
 * 计算属性的实现
 */
export class ComputedRefImpl<T> {
  public dep?: Dep = undefined
  public _value!: T
  public __v_isRef = true
  public readonly effect: ReactiveEffect<T>
  private _dirty = true
  constructor(getter: ComputedGetter<T>, private _setter: ComputedSetter<T>) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        triggerRefValue(this)
      }
    })
    this.effect.computed = this
  }
  get value() {
    trackRefValue(this)
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }
  set value(val: T) {
    this._setter(val)
  }
}
