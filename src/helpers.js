export const first = (v) => v[0]

export const last = (v) => v[v.length - 1]

export const walk = (node, callback, deep = true) => {
  if (!node) return

  let v = callback(node)
  if (v === false || v === null) return
  if (v?.nodeName) return walk(v, callback, deep)

  if (deep) walk(node.firstChild, callback, deep)
  if (v === 1) return
  walk(node.nextSibling, callback, deep)
}

export function templateNodeFromString(str) {
  let node = document.createElement("template")
  node.innerHTML = str.trim()
  return node
}
