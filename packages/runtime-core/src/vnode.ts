import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { isArray, isFunction, isObject, isString } from '@vue/shared'
import {
  normalizeClass,
  normalizeStyle
} from 'packages/shared/src/normalizedProp'
export interface VNode {
  __v_isVNode: boolean
  type: any
  props: any
  children: any
  shapeFlag: number
  el: any | null
  key?: any
  component?: any
}

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export const Comment = Symbol('Comment')

export function isVnode(value: any): value is VNode {
  return value ? value.__v_isVNode === true : false
}

/**
 * 创建虚拟节点
 * @param type 节点类型
 * @param props 属性
 * @param children 子节点
 * @returns 虚拟节点
 */
export function createVnode(type: any, props: any, children: any): VNode {
  if (props) {
    const { class: kclass, style } = props
    if (kclass) {
      props.class = normalizeClass(kclass)
    }
    if (style) {
      props.style = normalizeStyle(style)
    }
  }
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.COMPONENT
    : 0
  return createBaseVnode(type, props, children, shapeFlag)
}

function createBaseVnode(
  type: any,
  props: any,
  children: any,
  shapeFlag: number
): VNode {
  const vnode: VNode = {
    __v_isVNode: true,
    type,
    props,
    children,
    shapeFlag,
    el: null,
    key: props?.key || null
  }
  if (children) {
    normalizeChildren(vnode, children)
  }
  return vnode
}

export function normalizeChildren(vnode: VNode, children: any): void {
  let type = 0
  const { shapeFlag } = vnode
  if (children == null) {
    children = null
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else if (isObject(children)) {
  } else if (isFunction(children)) {
  } else {
    children = String(children)
    type = ShapeFlags.TEXT_CHILDREN
  }
  vnode.children = children
  vnode.shapeFlag |= type
}

export function isSameVNodeType(n1: VNode, n2: VNode): boolean {
  return n1.type === n2.type && n1.key === n2.key
}
