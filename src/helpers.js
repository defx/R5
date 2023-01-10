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
  if (!isWhitespace(node)) {
    let v = callback(node)
    if (v === false || v === null) return
    if (v?.nodeName) return walk(v, callback, deep)
  }
  if (deep) walk(node.firstChild, callback, deep)
  walk(node.nextSibling, callback, deep)
}

const transformBrackets = (str = "") => {
  let parts = str.split(/(\[[^\]]+\])/).filter((v) => v)
  return parts.reduce((a, part) => {
    let v = part.charAt(0) === "[" ? "." + part.replace(/\./g, ":") : part
    return a + v
  }, "")
}

const getTarget = (path, target) => {
  let parts = transformBrackets(path)
    .split(".")
    .map((k) => {
      if (k.charAt(0) === "[") {
        let p = k.slice(1, -1).replace(/:/g, ".")
        return getValueAtPath(p, target)
      } else {
        return k
      }
    })

  let t =
    parts.slice(0, -1).reduce((o, k) => {
      return o && o[k]
    }, target) || target
  return [t, last(parts)]
}

export const getValueAtPath = (path, target) => {
  let [a, b] = getTarget(path, target)
  let v = a?.[b]
  if (typeof v === "function") return v.bind(a)
  return v
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
