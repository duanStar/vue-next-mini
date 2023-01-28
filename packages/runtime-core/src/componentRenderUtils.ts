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
