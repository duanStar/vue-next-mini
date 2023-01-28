export function patchEvent(
  el: Element & { _vei?: Record<string, any> },
  rawName: string,
  prevValue: any,
  nextValue: any
) {
  const invokers = el._vei || (el._vei = {})
  const existingInvoker = invokers[rawName]
  if (nextValue && existingInvoker) {
    // 更新直接修改 invoker.value，不需要重新解绑和绑定事件，提高性能
    existingInvoker.value = nextValue
  } else {
    const name = parseName(rawName)
    if (nextValue) {
      // 创建 invoker 并绑定事件
      const invoker = (invokers[rawName] = createInvoker(nextValue))
      el.addEventListener(name, invoker)
    } else if (prevValue) {
      // 移除事件
      el.removeEventListener(name, existingInvoker)
      invokers[rawName] = undefined
    }
  }
}

function parseName(key: string): string {
  return key
    .replace(/^on(?=[^a-z])/, '')
    .trim()
    .toLocaleLowerCase()
}

function createInvoker(initialValue: any) {
  const invoker = (e: Event) => {
    invoker.value && invoker.value(e)
  }
  invoker.value = initialValue
  return invoker
}
