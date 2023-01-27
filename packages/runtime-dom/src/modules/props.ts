export function patchDOMProp(el: Element, key: string, nextValue, prevValue) {
  if (nextValue === prevValue) return
  el[key] = nextValue
}
