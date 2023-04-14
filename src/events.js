const eventListeners = new WeakMap()

export const handlers = []

export function bindEvents(rootNode, events = [], values = []) {
  if (typeof window === "undefined") return
  rootNode.$values = values
  const types = [...events]
  const listeners = eventListeners.get(rootNode) || {}
  types.forEach((type) => {
    if (type in listeners) return
    listeners[type] = (e) => {
      const index = +e.target.dataset[`on${type}`]
      const fn = handlers[index]
      fn?.(e)
    }
    rootNode.addEventListener(type, listeners[type])
  })
  eventListeners.set(rootNode, listeners)
}
