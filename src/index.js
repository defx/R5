export { html } from "./template.js"
import { update } from "./update.js"

const nodes = new WeakSet()
const eventListeners = new WeakMap()
const isServer = typeof window === "undefined"

function bindEvents(rootNode, events = [], values = []) {
  if (typeof window === "undefined") return
  rootNode.$values = values
  const types = [...events]
  const listeners = eventListeners.get(rootNode) || {}
  types.forEach((type) => {
    if (type in listeners) return
    listeners[type] = (e) => {
      const index = +e.target.dataset[`on${type}`]
      const fn = rootNode.$values[index]
      fn?.(e)
    }
    rootNode.addEventListener(type, listeners[type])
  })
  eventListeners.set(rootNode, listeners)
}

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
