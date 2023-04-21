export { html } from "./template.js"
import { update } from "./update.js"

const nodes = new WeakSet()
const isServer = typeof window === "undefined"
const eventListeners = new WeakMap()

export function bindEvents(rootNode, templateResult) {
  const {
    event: { types = [] },
  } = templateResult
  if (typeof window === "undefined") return
  const listeners = eventListeners.get(rootNode) || {}

  types.forEach((type) => {
    if (type in listeners) return

    listeners[type] = (e) => e.target.$handler?.[type]?.(e)
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
  }
  update(templateResult, rootNode.firstChild)
  bindEvents(rootNode, templateResult)
}
