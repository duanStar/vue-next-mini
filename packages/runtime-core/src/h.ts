import { isArray, isObject } from '@vue/shared'
import { createVnode, isVnode, VNode } from './vnode'

/**
 * 创建虚拟节点
 * @param type 节点类型
 * @param propsOrChildren 属性或子节点
 * @param children 子节点
 * @returns 虚拟节点
 */
export function h(type: any, propsOrChildren?: any, children?: any[]): VNode {
  let l = arguments.length
  if (l === 2) {
    if (isArray(propsOrChildren)) {
      return createVnode(type, null, propsOrChildren)
    }
    if (isObject(propsOrChildren) && isVnode(propsOrChildren)) {
      return createVnode(type, null, [propsOrChildren])
    } else {
      return createVnode(type, propsOrChildren, [])
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVnode(children)) {
      children = [children]
    }
    return createVnode(type, propsOrChildren, children)
  }
}
