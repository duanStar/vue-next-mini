import { EMPTY_ARR, EMPTY_OBJ, invokeArrayFns, isString } from '@vue/shared'
import { ReactiveEffect } from 'packages/reactivity/src/effect'
import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { normalizeVNode, renderComponentRoot } from './componentRenderUtils'
import { queuePreFlushCb } from './scheduler'
import { Comment, Fragment, isSameVNodeType, Text, VNode } from './vnode'

export interface RenderOptions {
  patchProp(el: Element, key: string, prev: any, next: any): void
  setElementText(node: Element, text: string): void
  insert(el, parent: Element, anchor: any): void
  createElement(type: string): Element
  remove(el: Element): void
  createText(text: string): Text
  setText(node: Text, text: string): void
  createComment(text: string): Comment
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
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText,
    createComment: hostCreateComment
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
      mountChildren(vnode.children, el, anchor)
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
          patchKeyedChildren(c1, c2, container, anchor)
        } else {
          // TODO: 卸载子节点
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(container, '')
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, container, anchor)
        }
      }
    }
  }

  // 更新diff子节点
  const patchKeyedChildren = (c1, c2, container, parentAnchor) => {
    let i = 0
    let l2 = c2.length
    let e1 = c1.length - 1
    let e2 = l2 - 1
    // 1.从前往后比较
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, null)
      } else {
        break
      }
      i++
    }

    // 2.从后往前比较
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, null)
      } else {
        break
      }
      e1--
      e2--
    }

    // 3.新节点比旧节点多
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[e2 + 1].el : parentAnchor
        while (i <= e2) {
          patch(null, c2[i], container, anchor)
          i++
        }
      }
    }
    // 4.旧节点比新节点多
    else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i])
          i++
        }
      }
    }
    // 5.旧节点和新节点都有,乱序
    else {
      const s1 = i
      const s2 = i

      // 5.1.创建新节点的key到index的映射
      const keyToNewIndexMap = new Map()
      for (i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        if (nextChild.key) {
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }

      // 5.2.遍历旧节点，找到可以复用或者删除的节点
      let j
      let patched = 0
      let toBePatched = e2 - s2 + 1
      let moved = false
      let maxNewIndexSoFar = 0
      const newIndexToOldIndexMap = new Array(toBePatched)
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i]
        if (patched >= toBePatched) {
          unmount(prevChild)
          continue
        }
        let newIndex
        if (prevChild.key) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          for (j = s2; j <= e2; j++) {
            if (
              newIndexToOldIndexMap[j - s2] === 0 &&
              isSameVNodeType(prevChild, c2[j])
            ) {
              newIndex = j
              break
            }
          }
        }
        if (newIndex === undefined) {
          unmount(prevChild)
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          patch(prevChild, c2[newIndex], container, parentAnchor)
          patched++
        }
      }

      // 5.3.移动节点
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : EMPTY_ARR
      j = increasingNewIndexSequence.length - 1
      for (i = toBePatched - 1; i >= 0; i--) {
        const newIndex = s2 + i
        const newChild = c2[newIndex]
        const anchor = newIndex + 1 < l2 ? c2[newIndex + 1].el : parentAnchor
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, newChild, container, anchor)
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(newChild, container, anchor)
          } else {
            j--
          }
        }
      }
    }
  }

  // 移动节点
  const move = (vnode, container, anchor) => {
    hostInsert(vnode.el, container, anchor)
  }

  // 挂载子节点
  const mountChildren = (children, container, anchor) => {
    if (isString(children)) {
      children = children.split('')
    }
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]))
      patch(null, child, container, anchor)
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

  // 卸载元素
  const unmount = (vnode: VNode) => {
    hostRemove(vnode.el)
  }

  // 处理文本节点
  const processText = (n1: VNode | null, n2: VNode, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        (n2.el = hostCreateText(n2.children as string)),
        container,
        anchor
      )
    } else {
      const el = (n2.el = n1.el)
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children as string)
      }
    }
  }

  // 处理注释节点
  const processComment = (n1: VNode | null, n2: VNode, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        (n2.el = hostCreateComment(n2.children as string)),
        container,
        anchor
      )
    } else {
      // 不支持动态修改注释节点
      n2.el = n1.el
    }
  }

  // 处理 Fragment
  const processFragment = (n1: VNode | null, n2: VNode, container, anchor) => {
    if (n1 == null) {
      mountChildren(n2.children, container, anchor)
    } else {
      patchChildren(n1, n2, container, anchor)
    }
  }

  // 处理组件
  const processComponent = (n1: VNode | null, n2: VNode, container, anchor) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor)
    } else {
    }
  }

  // 挂载组件
  const mountComponent = (initialVNode: VNode, container, anchor) => {
    const instance = (initialVNode.component =
      createComponentInstance(initialVNode))
    setupComponent(instance)
    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  function setupRenderEffect(instance, initialVNode: VNode, container, anchor) {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { bm, m } = instance

        if (bm) {
          invokeArrayFns(bm)
        }

        const subTree = (instance.subTree = renderComponentRoot(instance))
        patch(null, subTree, container, anchor)
        initialVNode.el = subTree.el

        if (m) {
          invokeArrayFns(m)
        }
        instance.isMounted = true
      } else {
        let { bu, u, next, vnode, subTree } = instance

        if (bu) {
          invokeArrayFns(bu)
        }
        if (next == null) {
          next = vnode
        }

        const nextTree = renderComponentRoot(instance)
        const prevTree = subTree
        instance.subTree = nextTree
        patch(prevTree, nextTree, container, anchor)
        next.el = nextTree.el

        if (u) {
          invokeArrayFns(u)
        }
      }
    }

    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queuePreFlushCb(update)
    ))

    const update = (instance.update = () => effect.run())

    update()
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
        processText(n1, n2, container, anchor)
        break
      case Comment:
        processComment(n1, n2, container, anchor)
        break
      case Fragment:
        processFragment(n1, n2, container, anchor)
        break
      default:
        if (ShapeFlags.ELEMENT & shapeFlag) {
          processElement(n1, n2, container, anchor)
        } else if (ShapeFlags.COMPONENT & shapeFlag) {
          processComponent(n1, n2, container, anchor)
        }
    }
  }

  // render函数
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

// 获取最长递增子序列
function getSequence(arr: any[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    let arrI = arr[i]
    if (arrI != 0) {
      j = result[result.length - 1]
      if (arrI > arr[j]) {
        p[i] = j
        result.push(i)
        continue
      } else {
        u = 0
        v = result.length - 1
        while (u < v) {
          c = (u + v) >> 1
          if (arr[result[c]] < arrI) {
            u = c + 1
          } else {
            v = c
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1]
          }
          result[u] = i
        }
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
