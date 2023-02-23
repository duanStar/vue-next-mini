import { isArray, isString } from '@vue/shared'
import { NodeTypes } from './ast'
import { helperNameMap } from './runtimeHelpers'
import { getVnodeHelper } from './utils'

const aliasHelper = (key: symbol) =>
  `${helperNameMap[key]}: _${helperNameMap[key]}`

export interface CodegenContext {
  code: string
  runtimeGLobal: string
  source: string
  indentLevel: number
  isSSR: boolean
  helper(key: symbol): string
  push(content: string): void
  newLine(): void
  indent(): void
  deIndent(): void
}

// 生成render函数
export function generate(ast, options) {
  const context = createCodegenContext(ast)
  const { push, helper, indent, newLine, deIndent } = context

  genFunctionPreamble(context)

  const functionName = 'render'
  const args = ['_ctx', '_cache']

  const signatures = args.join(', ')

  push(`function ${functionName}(${signatures}) {`)
  indent()

  const hasHelpers = ast.helpers.length > 0
  if (hasHelpers) {
    push(
      `const { ${ast.helpers
        .map((key: symbol) => `${aliasHelper(key)}`)
        .join(', ')} } = _Vue\n`
    )
    newLine()
  }

  push(`return `)

  if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  } else {
    push(`null`)
  }

  deIndent()
  push(`}`)

  return {
    ast,
    code: context.code
  }
}

// 创建上下文
function createCodegenContext(ast): CodegenContext {
  const context = {
    code: ``,
    runtimeGLobal: 'Vue',
    source: ast.loc.source,
    indentLevel: 0,
    isSSR: false,
    helper(key) {
      return `_${helperNameMap[key]}`
    },
    push(content) {
      context.code += content
    },
    newLine() {
      context.code += `\n` + `  `.repeat(context.indentLevel)
    },
    indent() {
      ++context.indentLevel
      context.newLine()
    },
    deIndent() {
      --context.indentLevel
      context.newLine()
    }
  }

  return context
}

// 生成render函数的前缀
function genFunctionPreamble(context: CodegenContext) {
  const { push, runtimeGLobal, newLine } = context
  const VueBinding = runtimeGLobal

  push(`const _Vue = ${VueBinding}\n`)
  newLine()
  push(`return `)
}

// 处理节点
function genNode(node, context: CodegenContext) {
  switch (node.type) {
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context)
      break
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.ELEMENT:
      genVNodeCall(node.codegenNode, context)
      break
  }
}

// 处理文本节点
function genText(node, context: CodegenContext) {
  context.push(JSON.stringify(node.content))
}

// 处理元素和组件节点
function genVNodeCall(node, context: CodegenContext) {
  const { push, helper } = context
  const {
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableCHecking,
    isComponent
  } = node

  const callHelper = getVnodeHelper(context.isSSR, isComponent)
  push(`${helper(callHelper)}(`)

  const args = genNullableArgs([tag, props, children, patchFlag, dynamicProps])
  genNodeList(args, context)
  push(`)`)
}

// 处理参数
function genNullableArgs(args: any[]) {
  let i = args.length
  while (i--) {
    if (args[i] != null) {
      break
    }
  }

  return args.slice(0, i + 1).map(arg => arg || 'null')
}

// 处理节点列表
function genNodeList(nodes, context: CodegenContext) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node)) {
      push(node)
    } else if (isArray(node)) {
      genNodeListArray(node, context)
    } else {
      genNode(node, context)
    }

    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}

function genNodeListArray(nodes, context: CodegenContext) {
  context.push('[')
  genNodeList(nodes, context)
  context.push(']')
}