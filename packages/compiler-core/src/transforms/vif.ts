import { isString } from '@vue/shared'
import {
  createCallExpression,
  createConditionalExpression,
  createObjectProperty,
  createSimpleExpression,
  NodeTypes
} from '../ast'
import { CREATE_COMMENT } from '../runtimeHelpers'
import {
  createStructuralDirectiveTransform,
  TransformContext
} from '../transform'
import { getMemoedVNodeCall } from '../utils'

// 转换if指令
export const transformIf = createStructuralDirectiveTransform(
  /^(if|else-if|else)$/,
  (node, dir, context: TransformContext) => {
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      let key = 0
      return () => {
        if (isRoot) {
          ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context)
        }
      }
    })
  }
)

// 处理if指令
export function processIf(
  node,
  dir,
  context: TransformContext,
  processCodegen?: (node, branch, isRoot: boolean) => () => void
) {
  if (dir.name === 'if') {
    const branch = createIfBranch(node, dir)
    const ifNode = {
      type: NodeTypes.IF,
      loc: {},
      branches: [branch]
    }

    // 替换当前节点
    context.replaceNode(ifNode)

    if (processCodegen) {
      return processCodegen(ifNode, branch, true)
    }
  }
}

// 创建if分支节点
function createIfBranch(node, dir) {
  return {
    type: NodeTypes.IF_BRANCH,
    loc: {},
    condition: dir.exp,
    children: [node]
  }
}

/**
 * 创建 ifNode 的 codegenNode
 * @param branch 分支节点
 * @param key
 * @param context transform 上下文
 * @returns
 */
function createCodegenNodeForBranch(branch, key, context: TransformContext) {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, key),
      createCallExpression(context.helper(CREATE_COMMENT), [`"v-if"`, 'true'])
    )
  } else {
    return createChildrenCodegenNode(branch, key)
  }
}

// 创建指定子节点的codegen
function createChildrenCodegenNode(branch, keyIndex) {
  const keyProperty = createObjectProperty(
    `key`,
    createSimpleExpression(`${keyIndex}`, false)
  )
  const { children } = branch
  const firstChild = children[0]
  const ret = firstChild.codegenNode
  const vnodeCall = getMemoedVNodeCall(ret)

  injectProp(vnodeCall, keyProperty)
}

export function injectProp(node, prop) {
  let propsWithInjection

  let props =
    node.type === NodeTypes.VNODE_CALL ? node.props : node.arguments[2]

  if (props == null || isString(props)) {
    propsWithInjection = createObjectExpression([prop])
  }

  node.props = propsWithInjection
}

export function createObjectExpression(properties) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    loc: {},
    properties
  }
}
