export function type({ textContent = "" }) {
  const t = textContent.match(/^{{(\d+)/)?.[1]
  return isNaN(t) ? t : +t
}

export function create(type, meta = {}) {
  const node = document.createComment(`{{${type}}}`)
  return setMeta(node, meta)
}

export function getMeta(node) {
  const meta = node.textContent.match(/meta\(([^)].+)\)/)?.[1]
  return meta ? JSON.parse(meta) : {}
}

export function setMeta(node, meta) {
  const t = type(node)
  node.textContent = `{{${t}:meta(${JSON.stringify(meta)})}}`
  return node
}
