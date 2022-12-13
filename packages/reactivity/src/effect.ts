import { ComputedRefImpl } from './computed'
import { Dep, createDep } from './dep'

export type EffectScheduler = (...args: any) => any
export let activeEffect: ReactiveEffect | null = null

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

export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    effect.scheduler()
  } else {
    effect.run()
  }
}

export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

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
}
