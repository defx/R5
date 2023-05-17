export { html } from "./template.js"
import { update } from "./update.js"

const nodes = new WeakSet()
const isServer = typeof window === "undefined"
const eventListeners = new WeakMap()

function nodeFromString(str) {
  let tpl = document.createElement("template")
  tpl.innerHTML = str.trim()
  return tpl.content.cloneNode(true)
}

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
      const k = e.target.dataset[`on${type}`]
      rootNode.$handlers[k]?.(e)
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
      rootNode.prepend(nodeFromString(markup))
    }
    nodes.add(rootNode)
  }
  update(templateResult, rootNode)
  bindEvents(rootNode, templateResult)
}
