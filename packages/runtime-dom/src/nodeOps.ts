const doc = document

export const nodeOps = {
  insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null)
  },
  createElement(tag): Element {
    return doc.createElement(tag)
  },
  setElementText(el: Element, text: string) {
    el.textContent = text
  },
  remove(el: Element) {
    const parent = el.parentNode
    if (parent) {
      parent.removeChild(el)
    }
  }
}
