import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandlers'

export const reactiveMap = new WeakMap<object, any>()

/**
 * reactive函数的作用是将一个普通对象转换成响应式对象
 * @param target 被代理的对象
 * @returns 响应式对象
 */
export function reactive(target: Object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

/**
 * createReactiveObject函数的作用是创建一个代理对象
 * @param target 被代理的对象
 * @param baseHandlers 代理对象的处理器
 * @param proxyMap 代理对象的缓存
 * @returns 代理对象
 */
export function createReactiveObject(
  target: Object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>
) {
  // 如果不是对象，直接返回
  if (!isObject(target)) {
    return target
  }
  // 读取缓存中的代理对象
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  // 创建代理对象
  const proxyObj = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxyObj)
  return proxyObj
}

/**
 * toRaw函数的作用是获取原始对象
 * @param observed 被代理的对象
 * @returns 原始对象
 */
export function toRaw<T>(observed: T) {
  const raw = observed && observed?.['__v_raw']
  return raw ? toRaw(raw) : observed
}

/**
 * toReactive函数的作用是将一个普通对象转换成响应式对象
 * @param value 原始对象
 * @returns 响应式对象
 */
export function toReactive<T extends unknown>(value: T) {
  return isObject(value) ? reactive(value) : value
}
