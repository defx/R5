export const EMPTY = "EMPTY"
export const REPEATED_BLOCK = "REPEATED_BLOCK"
export const BLOCK_OPEN = "BLOCK_OPEN"
export const BLOCK_CLOSE = "BLOCK_CLOSE"

export function type({ textContent = "" }) {
  return textContent.match(/^\s*{{\s*([^\s:]+)/m)?.[1]
}

export function create(type, meta = {}) {
  const node = document.createComment(`{{ ${type} }}`)
  return setMeta(node, meta)
}

export function getMeta(node) {
  const meta = node.textContent.match(/meta\(([^)].+)\)/)?.[1]
  return meta ? JSON.parse(meta) : {}
}

export function setMeta(node, meta) {
  const t = type(node)
  node.textContent = `{{ ${t}:meta(${JSON.stringify(meta)}) }}`
  return node
}
