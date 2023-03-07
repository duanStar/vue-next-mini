import { reactive } from '@vue/reactivity'
import { isFunction, isObject } from '@vue/shared'
import {
  onBeforeMount,
  onBeforeUpdate,
  onMounted,
  onUpdated
} from './apiLifecycle'
import { VNode } from './vnode'

let uid = 0
let compile: any = null

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
  const Component = instance.type
  const { setup } = Component
  if (setup) {
    const setupResult = setup()
    handleSetupResult(instance, setupResult)
  } else {
    finishComponentSetup(instance)
  }
}

export function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
  const Component = instance.type
  let { render } = Component
  if (!render && compile) {
    if (Component.template) {
      render = Component.render = compile(Component.template, {})
    }
  }

  if (render && !instance.render) {
    instance.render = render
  }

  applyOptions(instance)
}

export function registerRuntimeCompiler(_compiler: any) {
  compile = _compiler
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
