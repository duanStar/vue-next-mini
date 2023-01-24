import { isStartsWithOn } from '@vue/shared'
import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'

export const patchProp = (el, key, prevValue, nextValue) => {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  } else if (isStartsWithOn(key)) {
  } else {
  }
}
