import { reactive } from '@vue/reactivity'
import { isObject } from '@vue/shared'
import {
  onBeforeMount,
  onBeforeUpdate,
  onMounted,
  onUpdated
} from './apiLifecycle'
import { VNode } from './vnode'

let uid = 0

export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um'
}

export function createComponentInstance(vnode: VNode) {
  const instance = {
    uid: uid++,
    vnode,
    type: vnode.type,
    subTree: null,
    effect: null,
    render: null,
    update: null,
    isMounted: false,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    bum: null,
    um: null,
    next: null
  }
  return instance
}

export function setupComponent(instance) {
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
  const Component = instance.type
  const { setup, render } = Component
  instance.render = render

  applyOptions(instance)
}

// init options
function applyOptions(instance) {
  const {
    data: dataOptions,
    beforeCreate,
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated
  } = instance.type

  if (beforeCreate) {
    callHook(beforeCreate, instance)
  }

  if (dataOptions) {
    const data = dataOptions()
    if (isObject(data)) {
      instance.data = reactive(data)
    }
  }

  if (created) {
    callHook(created, instance)
  }

  function registerLifecycleHook(register: Function, hook?: Function) {
    register(hook?.bind(instance.data), instance)
  }

  registerLifecycleHook(onBeforeMount, beforeMount)
  registerLifecycleHook(onMounted, mounted)
  registerLifecycleHook(onBeforeUpdate, beforeUpdate)
  registerLifecycleHook(onUpdated, updated)
}

function callHook(hook: Function, instance) {
  hook?.call(instance.data)
}
