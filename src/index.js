export { html } from "./template.js"
import { update } from "./update.js"

const nodes = new WeakSet()
const isServer = typeof window === "undefined"

const eventListeners = new WeakMap()

export function bindEvents(rootNode, templateResult) {
  const {
    event: { types = [], handlers = {} },
  } = templateResult
  if (typeof window === "undefined") return
  const listeners = eventListeners.get(rootNode) || {}

  rootNode.$handlers = handlers

  types.forEach((type) => {
    if (type in listeners) return
    listeners[type] = (e) => {
      const index = +e.target.dataset[`on${type}`]
      rootNode.$handlers[index]?.(e)
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
  bindEvents(rootNode, templateResult)
}
