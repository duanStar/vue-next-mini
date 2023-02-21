import { NodeTypes } from '../ast'
import { isText } from '../utils'

// 转换文本节点（将相邻的文本节点和表达式合并为一个表达式）
// 如：<div>hello {{msg}}</div>,有hello文本节点和{{msg}}表达式节点，这两个节点在生成render函数会被合并：'hello' + _toDisplayString(_ctx.msg), 在合并的时候就需要拼接 + 符号
export const transformText = (node, context) => {
  if (
    node.type === NodeTypes.ROOT ||
    node.type === NodeTypes.ELEMENT ||
    node.type === NodeTypes.FOR ||
    node.type === NodeTypes.IF_BRANCH
  ) {
    return () => {
      const children = node.children
      let currentContainer
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j]

            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = createCompoundExpression(
                  [child],
                  child.loc
                )
              }

              currentContainer.children.push(' + ', next)
              children.splice(j, 1)
              j--
            } else {
              currentContainer = undefined
              break
            }
          }
        }
      }
    }
  }
  return null
}

export function createCompoundExpression(children, loc) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    children,
    loc
  }
}
