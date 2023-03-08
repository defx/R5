export { html } from "./template.js"
import { update } from "./update.js"

const nodes = new WeakSet()

export function render(templateResult, rootNode) {
  if (!nodes.has(rootNode)) {
    const { markup } = templateResult
    rootNode.innerHTML = markup
    nodes.add(rootNode)
  } else {
    update(templateResult, rootNode.firstChild)
  }
}
