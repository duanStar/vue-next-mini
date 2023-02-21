import { createVNodeCall, NodeTypes } from '../ast'
import { TransformContext } from '../transform'

// 转换元素节点
export const transformElement = (node, context: TransformContext) => {
  return function postTransformElement() {
    const node = context.currentNode

    if (node.type !== NodeTypes.ELEMENT) {
      return
    }

    const { tag } = node
    let vnodeTag = `"${tag}"`
    let vnodeProps = []
    let vnodeChildren = node.children

    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren
    )
  }
}
