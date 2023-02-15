export { html } from "./template.js"
import { update } from "./dom.js"
import { templateNodeFromString } from "./helpers.js"

const nodes = new WeakSet()

export function render(templateResult, rootNode) {
  if (!nodes.has(rootNode)) {
    const frag = templateNodeFromString(templateResult.t).content.cloneNode(
      true
    )
    update(templateResult, frag.firstChild)
    rootNode.prepend(frag)
    nodes.add(rootNode)
  } else {
    update(templateResult, rootNode.firstChild)
  }
}
