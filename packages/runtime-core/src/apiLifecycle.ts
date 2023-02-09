import { LifecycleHooks } from './component'

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)

function createHook(lifecycle: LifecycleHooks) {
  return (hook, target) => injectHook(lifecycle, hook, target)
}

function injectHook(lifecycle, hook, target) {
  if (target && hook) {
    const hooks = target[lifecycle] || (target[lifecycle] = [])
    hooks.push(hook)
  }
}
