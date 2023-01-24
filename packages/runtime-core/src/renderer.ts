import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { Comment, Fragment, Text, VNode } from './vnode'

export interface RenderOptions {
  patchProp(el: Element, key: string, prev: any, next: any): void
  setElementText(node: Element, text: string): void
  insert(el, parent: Element, anchor: any): void
  createElement(type: string): Element
}

export function createRenderer(options: RenderOptions) {
  return baseCreateRenderer(options)
}

function baseCreateRenderer(options: RenderOptions) {
  const {
    insert: hostInsert,
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    setElementText: hostSetElementText
  } = options

  const mountElement = (vnode: VNode, container, anchor) => {
    const { type, shapeFlag, props } = vnode
    // 1.创建元素
    const el = (vnode.el = hostCreateElement(type))
    // 2.处理子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // mountChildren(vnode.children, el)
    }

    // 3.处理属性
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    // 4.插入元素
    hostInsert(el, container, anchor)
  }

  const processElement = (n1: VNode, n2: VNode, container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container, anchor)
    } else {
      // patchElement(n1, n2, container)
    }
  }

  const patch = (n1: VNode, n2: VNode, container, anchor = null) => {
    if (n1 === n2) return
    const { type, shapeFlag } = n2
    switch (type) {
      case Text:
        break
      case Comment:
        break
      case Fragment:
        break
      default:
        if (ShapeFlags.ELEMENT & shapeFlag) {
          processElement(n1, n2, container, anchor)
        } else if (ShapeFlags.COMPONENT & shapeFlag) {
        }
    }
  }
  const render = (vnode: VNode, container) => {
    if (vnode == null) {
    } else {
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }
  return {
    render
  }
}
