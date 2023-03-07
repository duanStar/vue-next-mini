import { isString } from '@vue/shared'
import { createVnode } from './vnode'

export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps = {}) {
    const app = {
      _component: rootComponent,
      _container: null,
      mount(rootContainer) {
        const vnode = createVnode(rootComponent, rootProps, null)
        render(vnode, rootContainer)
      }
    }
    return app
  }
}
