import { NodeTypes } from './ast'
import { isSingleElementRoot } from './hoistStatic'

export interface TransformContext {
  root
  parent: ParentNode | null
  childIndex: number
  currentNode
  helpers: Map<symbol, number>
  helper<T extends symbol>(name: T): T
  nodeTransforms: any[]
}

// 转换ast到 js ast
export function transform(root, options) {
  const context: TransformContext = createTransformContext(root, options)
  traverseNode(root, context)
  createRootCodegen(root)
  root.helpers = [...context.helpers.keys()]
  root.components = []
  root.directives = []
  root.imports = []
  root.cached = []
  root.temps = []
  root.hoists = []
}

// 创建转换上下文
export function createTransformContext(
  root,
  { nodeTransforms = [] }
): TransformContext {
  const context: TransformContext = {
    nodeTransforms,
    root,
    helpers: new Map(),
    currentNode: root,
    parent: null,
    childIndex: 0,
    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    }
  }

  return context
}

// 遍历节点，深度优先
export function traverseNode(node, context: TransformContext) {
  context.currentNode = node
  const { nodeTransforms } = context
  const exitFns: any[] = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)
    if (onExit) {
      exitFns.push(onExit)
    }
  }

  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break
  }

  context.currentNode = node
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

// 遍历子节点
export function traverseChildren(parent, context: TransformContext) {
  parent.children.forEach((child, index) => {
    context.parent = parent
    context.childIndex = index
    traverseNode(child, context)
  })
}

export function createRootCodegen(root) {
  const { children } = root

  if (children.length === 1) {
    const child = children[0]
    if (isSingleElementRoot(root, child) && child.codegenNode) {
      root.codegenNode = child.codegenNode
    }
  }
}