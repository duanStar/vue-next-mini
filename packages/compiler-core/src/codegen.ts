import { isArray, isString } from '@vue/shared'
import { NodeTypes } from './ast'
import { helperNameMap, TO_DISPLAY_STRING } from './runtimeHelpers'
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

  push(`with (_ctx) {`)
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
    case NodeTypes.IF:
    case NodeTypes.ELEMENT:
      genNode(node.codegenNode, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    case NodeTypes.JS_CONDITIONAL_EXPRESSION:
      genConditionalExpression(node, context)
      break
    case NodeTypes.JS_CALL_EXPRESSION:
      genCallExpression(node, context)
      break
  }
}

function genCallExpression(node, context: CodegenContext) {
  const { push, helper } = context
  const callee = isString(node.callee) ? node.callee : helper(node.callee)
  push(callee + '(')
  genNodeList(node.arguments, context)
  push(')')
}

// 处理if条件
function genConditionalExpression(node, context: CodegenContext) {
  const { test, consequent, newline: needNewline, alternate } = node
  const { indent, deIndent, push, newLine } = context

  if (test.type === NodeTypes.SIMPLE_EXPRESSION) {
    genExpression(test, context)
  }

  context.indentLevel++
  needNewline && newLine()

  needNewline || push(` `)
  push('? ')

  genNode(consequent, context)

  needNewline && newLine()
  needNewline || push(` `)
  push(': ')

  const isNested = alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION
  if (isNested) {
    context.indentLevel++
  }
  genNode(alternate, context)

  if (isNested) {
    context.indentLevel--
  }

  needNewline && deIndent()
}

// 处理表达式
function genExpression(node, context: CodegenContext) {
  const { content, isStatic } = node
  context.push(isStatic ? JSON.stringify(content) : content)
}

// 处理插值表达式
function genInterpolation(node, context: CodegenContext) {
  const { content } = node
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(content, context)
  push(`)`)
}

// 处理复合表达式
function genCompoundExpression(node, context: CodegenContext) {
  const { children } = node
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (isString(child)) {
      context.push(child)
    } else {
      genNode(child, context)
    }
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
