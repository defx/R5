export const wrapToken = (v) => {
  v = v.trim()
  if (v.startsWith("{{")) return v
  return `{{${v}}}`
}

export const last = (v = []) => v[v.length - 1]

export const isWhitespace = (node) => {
  return node.nodeType === node.TEXT_NODE && node.nodeValue.trim() === ""
}

export const walk = (node, callback, deep = true) => {
  if (!node) return
  // if (!isWhitespace(node)) {
  let v = callback(node)
  if (v === false || v === null) return
  if (v?.nodeName) return walk(v, callback, deep)
  // }
  if (deep) walk(node.firstChild, callback, deep)
  walk(node.nextSibling, callback, deep)
}

export const debounce = (fn) => {
  let wait = false
  let invoke = false
  return () => {
    if (wait) {
      invoke = true
    } else {
      wait = true
      fn()
      requestAnimationFrame(() => {
        if (invoke) fn()
        wait = false
      })
    }
  }
}
