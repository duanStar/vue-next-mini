import { extend } from '@vue/shared'
import { ComputedRefImpl } from './computed'
import { Dep, createDep } from './dep'

export type EffectScheduler = (...args: any) => any
export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler: EffectScheduler
}

export let activeEffect: ReactiveEffect | null = null

// 保存当前响应式对象的副作用
const targetMap: WeakMap<object, Map<unknown, Dep>> = new WeakMap()

/**
 * 收集依赖
 * @param target 被代理的对象
 * @param key 被代理的对象的属性
 */
export function track(target: object, key: unknown) {
  if (!activeEffect) return
  let depMap = targetMap.get(target)
  if (!depMap) {
    targetMap.set(target, (depMap = new Map()))
  }
  let dep = depMap.get(key)
  if (!dep) {
    depMap.set(key, (dep = createDep()))
  }
  trackEffects(dep)
}

/**
 * 收集依赖 - 将当前的effect添加到dep中
 * @param dep 依赖
 */
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
}

/**
 * 触发依赖
 * @param target 被代理的对象
 * @param key 被代理的对象的属性
 */
export function trigger(target: object, key: unknown) {
  const depMap = targetMap.get(target)
  if (!depMap) return
  const dep: Dep | undefined = depMap.get(key)
  if (dep) {
    triggerEffects(dep)
  }
}

/**
 * 触发依赖 - 执行dep中的所有effect
 * @param dep 依赖
 */
export function triggerEffects(dep: Dep) {
  const effects = Array.isArray(dep) ? dep : Array.from(dep)
  // computed effect should be run first
  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect)
    }
  }
  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect)
    }
  }
}

/**
 * 触发副作用
 * @param effect 副作用
 */
export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    effect.scheduler()
  } else {
    effect.run()
  }
}

/**
 * 副作用函数
 * @param fn 副作用函数
 * @param options 配置项
 */
export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  const _effect = new ReactiveEffect(fn)
  if (options) {
    extend(_effect, options)
  }
  if (!options || !options.lazy) {
    _effect.run()
  }
}

/**
 * 副作用类
 */
export class ReactiveEffect<T = any> {
  computed?: ComputedRefImpl<T>
  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null
  ) {}

  run() {
    activeEffect = this
    return this.fn()
  }

  stop() {}
}
