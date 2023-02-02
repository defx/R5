export const EMPTY = "EMPTY"
export const REPEATED_BLOCK = "REPEATED_BLOCK"

export function type({ textContent }) {
  return textContent.match(/^{{ ([^\s:]+)/)?.[1]
}

export function create(type) {
  return document.createComment(`{{ ${type} }}`)
}
