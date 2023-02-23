import { startsWith } from '@vue/shared'
import { createRoot, ElementTypes, NodeTypes } from './ast'

const enum TagType {
  Start,
  End
}

interface ParserContext {
  source: string
}

// 创建解析上下文
function createParserContext(content: string): ParserContext {
  return {
    source: content
  }
}

// 解析模板入口
export function baseParse(content: string) {
  const context = createParserContext(content)
  const children = parseChildren(context, [])

  return createRoot(children)
}

// 解析函数
function parseChildren(context: ParserContext, ancestors: any[]) {
  const nodes = []

  while (!isEnd(context, ancestors)) {
    const s = context.source
    let node
    if (startsWith(s, '{{')) {
      // TODO: 模板表达式
    } else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      } else if (s[1] === '/') {
        parseTag(context, TagType.End)
        continue
      }
    }

    if (!node) {
      node = parseText(context, ancestors)
    }

    pushNode(nodes, node)
  }

  return nodes
}

function pushNode(nodes: any[], node: any) {
  if (node) {
    nodes.push(node)
  }
}

// 解析元素
function parseElement(context: ParserContext, ancestors: any[]) {
  const element = parseTag(context, TagType.Start)

  if (element.isSelfClosing) {
    return element
  }

  ancestors.push(element)
  const children = parseChildren(context, ancestors)
  ancestors.pop()

  element.children = children

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  }

  return element
}

// 解析文本
function parseText(context: ParserContext, ancestors: any[]) {
  const endTokens = ['<', '{{']
  let endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  const content = parseTextData(context, endIndex)

  return {
    type: NodeTypes.TEXT,
    content
  }
}

// 解析文本内容
function parseTextData(context: ParserContext, length: number) {
  const rawText = context.source.slice(0, length)
  advanceBy(context, length)
  return rawText
}

// 解析标签
function parseTag(context: ParserContext, type: TagType) {
  const s = context.source
  const match: any = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(s)
  const tag = match[1]
  advanceBy(context, match[0].length)

  let isSelfClosing = startsWith(context.source, '/>')
  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    tag,
    isSelfClosing,
    tagType: ElementTypes.ELEMENT,
    props: {},
    children: []
  }
}

// 向前移动指针，更新上下文的 source
function advanceBy(context: ParserContext, numberOfCharacters: number) {
  context.source = context.source.slice(numberOfCharacters).trimStart()
}

// 判断是否到达模板末尾
function isEnd(context: ParserContext, ancestors: any[]) {
  const s = context.source

  if (startsWith(s, '</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true
      }
    }
  }

  return !s
}

// 判断是否到达结束标签
function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    startsWith(source, '</') &&
    source.slice(2, tag.length + 2) === tag &&
    /[\t\r\n\f />]/.test(source[tag.length + 2] || '>')
  )
}
