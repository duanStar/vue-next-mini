import { NodeTypes } from './ast'
import { CREATE_ELEMENT_VNODE, CREATE_VNODE } from './runtimeHelpers'

export const isText = node =>
  node &&
  (node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION)

export const getVnodeHelper = (ssr: boolean, isComponent: boolean) => {
  return ssr || isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE
}
