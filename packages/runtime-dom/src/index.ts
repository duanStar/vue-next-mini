import { extend, isString } from '@vue/shared'
import { createRenderer } from 'packages/runtime-core/src/renderer'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

let renderer: any = null
const renderOptions = extend({ patchProp }, nodeOps)

function ensureRenderer() {
  return renderer || (renderer = createRenderer(renderOptions))
}

export const render = (...args) => {
  ensureRenderer().render(...args)
}

export const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args)

  const { mount } = app

  app.mount = (containerOrSelector: string | Element) => {
    const container = normalizeContainer(containerOrSelector)
    if (container) {
      mount(container)
    } else {
      console.error('Failed to mount app: mount target selector returned null.')
    }
  }

  return app
}

function normalizeContainer(container: string | Element): Element | null {
  if (isString(container)) {
    const res = document.querySelector(container)
    return res
  }
  return container
}
