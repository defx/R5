export { html } from "./template.js"
import { update } from "./update.js"
import { bindEvents } from "./events.js"

const nodes = new WeakSet()
const isServer = typeof window === "undefined"

export function render(templateResult, rootNode) {
  const { markup } = templateResult
  if (isServer || !rootNode) return markup

  if (!nodes.has(rootNode)) {
    if (rootNode.innerHTML !== markup) {
      rootNode.innerHTML = markup
    }
    nodes.add(rootNode)
  } else {
    update(templateResult, rootNode.firstChild)
  }
  bindEvents(rootNode, templateResult.events, templateResult.values)
}
