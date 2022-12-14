import {
  EMPTY_OBJ,
  hasChanged,
  isArray,
  isFunction,
  isMap,
  isObject,
  isPlainObject,
  isSet,
  NOOP
} from '@vue/shared'
import { EffectScheduler, ReactiveEffect } from 'packages/reactivity/src/effect'
import { isReactive } from 'packages/reactivity/src/reactive'
import { isRef } from 'packages/reactivity/src/ref'
import { queuePreFlushCb } from './scheduler'

export interface WatchOptions {
  deep?: boolean
  immediate?: boolean
  flush?: 'pre' | 'post' | 'sync'
}

const INITIAL_WATCHER_VALUE = {}

/**
 * 监听对象的变化
 * @param source 用于监听的对象，可以是ref、reactive、computed、function、object、array、map、set等
 * @param cb 回调函数
 * @param options 选项
 * @returns
 */
export function watch(source: unknown, cb: Function, options?: WatchOptions) {
  return doWatch(source, cb, options)
}

/**
 * 实现监听对象的变化
 * @param source 用于监听的对象，可以是ref、reactive、computed、function、object、array、map、set等
 * @param cb 回调函数
 * @param param2 选项
 */
export function doWatch(
  source: unknown,
  cb: Function | null,
  { immediate, deep, flush = 'pre' }: WatchOptions = EMPTY_OBJ
) {
  let getter: () => any
  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    deep = true
  } else if (isFunction(source)) {
    getter = () => source()
  } else {
    getter = NOOP
  }
  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }
  let oldValue = INITIAL_WATCHER_VALUE
  let job = () => {
    if (cb) {
      const newValue = effect.run()
      if (deep || hasChanged(newValue, oldValue)) {
        cb(newValue, oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue)
        oldValue = newValue
      }
    }
  }
  let scheduler: EffectScheduler
  if (flush === 'sync') {
    scheduler = job
  } else if (flush === 'post') {
  } else {
    scheduler = () => queuePreFlushCb(job)
  }

  const effect = new ReactiveEffect(getter, scheduler!)
  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  } else {
    effect.run()
  }
  return () => {
    effect.stop()
  }
}

/**
 * 遍历对象
 * @param value 用于遍历的对象
 * @param seen 用于存储已经遍历过的对象
 * @returns
 */
export function traverse(value: unknown, seen?: Set<unknown>) {
  if (!isObject(value)) return value
  seen = seen || new Set()
  if (seen.has(value)) return value
  seen.add(value)
  if (isRef(value)) {
    traverse(value.value, seen)
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: any) => traverse(v, seen))
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse(value[key], seen)
    }
  }
  return value
}
