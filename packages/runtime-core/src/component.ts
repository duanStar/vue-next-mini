import { VNode } from './vnode'

let uid = 0

export function createComponentInstance(vnode: VNode) {
  const instance = {
    uid: uid++,
    vnode,
    type: vnode.type,
    subTree: null,
    effect: null,
    render: null,
    update: null,
    isMounted: false
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
  if (setup) {
    // const setupResult = setup()
    // handleSetupResult(instance, setupResult)
  }
}
