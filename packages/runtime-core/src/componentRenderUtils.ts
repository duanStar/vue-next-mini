import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { createVnode, Text } from './vnode'

export function normalizeVNode(child) {
  if (child && typeof child === 'object') {
    return cloneIfMounted(child)
  } else {
    return createVnode(Text, null, String(child))
  }
}

export function cloneIfMounted(child) {
  return child
}

export function renderComponentRoot(instance) {
  const { vnode, render, data } = instance
  let result
  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      result = normalizeVNode(render.call(data))
    }
  } catch (err) {
    console.error(err)
  }
  return result
}
