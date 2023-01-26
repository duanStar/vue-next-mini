import { EMPTY_OBJ } from '@vue/shared'
import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { Comment, Fragment, isSameVNodeType, Text, VNode } from './vnode'

export interface RenderOptions {
  patchProp(el: Element, key: string, prev: any, next: any): void
  setElementText(node: Element, text: string): void
  insert(el, parent: Element, anchor: any): void
  createElement(type: string): Element
  remove(el: Element): void
}

export function createRenderer(options: RenderOptions) {
  return baseCreateRenderer(options)
}

function baseCreateRenderer(options: RenderOptions) {
  const {
    insert: hostInsert,
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    setElementText: hostSetElementText,
    remove: hostRemove
  } = options

  // 挂载元素
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

  // 更新元素
  const patchElement = (n1: VNode, n2: VNode, container) => {
    let el = (n2.el = n1.el)
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    patchChildren(n1, n2, el, null)

    patchProps(el, n2, oldProps, newProps)
  }

  // 更新子节点
  const patchChildren = (n1: VNode, n2: VNode, container, anchor) => {
    const c1 = n1 && n1.children
    const prevShapeFlag = n1 ? n1.shapeFlag : 0
    const c2 = n2 && n2.children
    const shapeFlag = n2 ? n2.shapeFlag : 0

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // TODO: 卸载子节点
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // TODO: diff
        } else {
          // TODO: 卸载子节点
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(container, '')
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // mountChildren(c2, container)
        }
      }
    }
  }

  // 更新属性
  const patchProps = (el, vnode, oldProps, newProps) => {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const next = newProps[key]
        const prev = oldProps[key]
        if (next !== prev) {
          hostPatchProp(el, key, prev, next)
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  // 处理元素节点
  const processElement = (n1: VNode | null, n2: VNode, container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container, anchor)
    } else {
      patchElement(n1, n2, container)
    }
  }

  const unmount = (vnode: VNode) => {
    hostRemove(vnode.el)
  }

  // 开始更新
  const patch = (n1: VNode | null, n2: VNode, container, anchor = null) => {
    if (n1 === n2) return
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }
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
      if (container._vnode) {
        unmount(container._vnode)
      }
    } else {
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }
  return {
    render
  }
}
