import { last, templateNodeFromString, walk } from "./helpers.js"
import * as Placeholder from "./placeholder.js"
import {
  CONDITIONAL_BLOCK_OPEN,
  CONDITIONAL_BLOCK_CLOSE,
} from "./placeholder.js"

export function create(stringTemplate, meta = {}) {
  const metaJSON = JSON.stringify(meta)
  const { childNodes: nodes } = templateNodeFromString(
    `<!-- {{ ${CONDITIONAL_BLOCK_OPEN}:meta(${metaJSON}) }} -->${stringTemplate}<!-- {{ ${CONDITIONAL_BLOCK_CLOSE}:meta(${metaJSON}) }} -->`
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
  const { id } = Placeholder.getMeta(placeholder)

  if (!id) return []
  const blocks = []
  let open = false

  walk(
    placeholder.nextSibling,
    (node) => {
      // ...
      if (node.nodeType === Node.COMMENT_NODE) {
        const type = Placeholder.type(node)

        if (type === CONDITIONAL_BLOCK_OPEN) {
          const meta = Placeholder.getMeta(node)
          if (meta.id === id) {
            open = true
            blocks.push({
              meta,
              nodes: [node],
            })
          }
        }
        if (
          type === CONDITIONAL_BLOCK_CLOSE &&
          Placeholder.getMeta(node).id === id
        ) {
          last(blocks).nodes.push(node)
          open = false
          if (blocks.length === 1) {
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
