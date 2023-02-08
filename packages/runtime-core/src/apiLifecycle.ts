import { LifecycleHooks } from './component'

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)

function createHook(lifecycle: LifecycleHooks) {
  return (hook, target) => injectHook(lifecycle, hook, target)
}

function injectHook(lifecycle, hook, target) {
  if (target) {
    const hooks = target[lifecycle] || (target[lifecycle] = [])
    hooks.push(hook)
  }
}
