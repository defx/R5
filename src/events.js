const eventListeners = new WeakMap()

export function mergeTemplateEvents(a, b) {
  if (a?.types && b?.types) {
    a.types.push(...b.types)
    a.handlers = {
      ...a.handlers,
      ...b.handlers,
    }
  }
  return a
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
      const index = +e.target.dataset[`on${type}`]
      rootNode.$handlers[index]?.(e)
    }
    rootNode.addEventListener(type, listeners[type])
  })
  eventListeners.set(rootNode, listeners)
}
