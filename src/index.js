export { html } from "./template.js"
import { update } from "./update.js"

const nodes = new WeakSet()

function bindEvents(rootNode, values) {
  if (typeof window === "undefined") return
  const nodes = [...rootNode.querySelectorAll(`[data-on]`)]
  console.log(nodes, values)
}

export function render(templateResult, rootNode) {
  if (!nodes.has(rootNode)) {
    const { markup } = templateResult
    rootNode.innerHTML = markup
    nodes.add(rootNode)
    bindEvents(rootNode, templateResult.values)
  } else {
    update(templateResult, rootNode.firstChild)
  }
}
