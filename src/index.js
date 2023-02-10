export { html } from "./template.js"
import { update } from "./dom.js"
import { templateNodeFromString } from "./helpers.js"

export function setup(parentNode, fn) {
  let initialised = false
  return function render(...args) {
    const result = fn(...args)
    if (!initialised) {
      const frag = templateNodeFromString(result.t).content.cloneNode(true)
      update(result, frag.firstChild)
      parentNode.prepend(frag)
      initialised = true
    } else {
      update(result, parentNode.firstChild)
    }
  }
}
