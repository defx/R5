import { last, templateNodeFromString, walk } from "./helpers.js"
import * as Placeholder from "./placeholder.js"
import { BLOCK_OPEN, BLOCK_CLOSE } from "./placeholder.js"

export function create(stringTemplate, meta = {}) {
  const metaJSON = JSON.stringify(meta)
  const { childNodes: nodes } = templateNodeFromString(
    `<!-- {{ ${BLOCK_OPEN}:meta(${metaJSON}) }} -->${stringTemplate}<!-- {{ ${BLOCK_CLOSE}:meta(${metaJSON}) }} -->`
  ).content.cloneNode(true)

  return {
    meta,
    nodes,
  }
}

export function remove(block) {
  block.nodes.forEach((node) => node.remove())
}

export function get(placeholder) {
  const { id, length = 0 } = Placeholder.getMeta(placeholder)

  if (!id || length === 0) return []
  const blocks = []
  let open = false
  walk(
    placeholder.nextSibling,
    (node) => {
      // ...
      if (node.nodeType === Node.COMMENT_NODE) {
        const type = Placeholder.type(node)

        if (type === BLOCK_OPEN) {
          const meta = Placeholder.getMeta(node)
          if (meta.groupId === id) {
            open = true
            blocks.push({
              meta,
              nodes: [node],
            })
          }
        }
        if (type === BLOCK_CLOSE && Placeholder.getMeta(node).groupId === id) {
          last(blocks).nodes.push(node)
          open = false
          if (blocks.length === length) {
            // stop looking
            return false
          }
        }
      } else if (open) {
        last(blocks).nodes.push(node)
      }
    },
    false
  )

  return blocks
}
