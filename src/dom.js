import {
  ATTRIBUTE,
  TEXT,
  EMPTY,
  EVENT,
  REPEATED_BLOCK,
  CONDITIONAL_BLOCK,
  STATIC,
  DYNAMIC,
} from "./constants.js"
import { last, walk } from "./helpers.js"
import * as Placeholder from "./placeholder.js"
import * as Blocks from "./blocks.js"
import * as ConditionalBlocks from "./conditional.js"

function isTemplateResult(v) {
  return v && Object.keys(v).sort().join(".") === "$key.key.m.t.v"
}

function asTemplate(str) {
  let tpl = document.createElement("template")
  tpl.innerHTML = str.trim()
  if (tpl.content.firstElementChild?.nodeName === "TEMPLATE") {
    return tpl.content.firstElementChild
  }
  return tpl
}

export function fromTemplate(str) {
  return asTemplate(str).content.cloneNode(true)
}

function truthy(v) {
  return v === 0 || v
}

function typeOfValue(v) {
  if (Array.isArray(v) && isTemplateResult(v[0])) {
    return REPEATED_BLOCK
  }

  if (isTemplateResult(v)) {
    return CONDITIONAL_BLOCK
  }

  return TEXT
}

// @todo: cache the node refs so that we only walk the whole tree on the first update
export const update = (templateResult, rootNode) => {
  const { m, v } = templateResult

  let k = -1

  walk(rootNode, (node) => {
    k += 1

    if (k in m === false) return

    for (const entry of m[k]) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        switch (entry.type) {
          case ATTRIBUTE: {
            const { name, parts } = entry

            const value = parts.reduce((a, [type, X]) => {
              if (type === DYNAMIC) {
                const x = v[X]
                if (!a && typeof x === "boolean") return x
                return a + v[X]
              } else {
                return a + X
              }
            }, "")

            if (typeof value === "boolean" && !name.startsWith("aria-")) {
              if (value) {
                node.setAttribute(name, "")
              } else {
                node.removeAttribute(name)
              }
              break
            }

            if (node.getAttribute(name) !== value) {
              node.setAttribute(name, value)
            }
            break
          }
          case EVENT: {
            const { name, index } = entry

            if (!node.$listening) {
              node.addEventListener(name, (e) => node.$handler?.(e))
              node.$listening = true
            }

            node.$handler = v[index]

            break
          }
        }
      } else {
        // TEXT, COMMENT
        const value = v[entry.index]
        const valueType = typeOfValue(value)
        let placeholderType = Placeholder.type(node)

        if (truthy(value)) {
          switch (placeholderType) {
            case EMPTY: {
              // upgrade...
              if (valueType === TEXT) {
                const textNode = document.createTextNode(value)
                node.replaceWith(textNode)
                return textNode.nextSibling
                break
              }
              if (valueType === REPEATED_BLOCK) {
                const id = Date.now()
                const placeholder = Placeholder.create(REPEATED_BLOCK, { id })
                node.replaceWith(placeholder)
                k -= 1
                return placeholder
              }
              if (valueType === CONDITIONAL_BLOCK) {
                const id = Date.now()
                const placeholder = Placeholder.create(CONDITIONAL_BLOCK, {
                  id,
                  rendered: false,
                })
                node.replaceWith(placeholder)
                k -= 1
                return placeholder
              }
            }

            case CONDITIONAL_BLOCK: {
              const { rendered } = Placeholder.getMeta(node)
              if (rendered) return
              const block = ConditionalBlocks.create(value.t, {
                id: Date.now(),
              })
              node.after(...block.nodes)
              return
            }

            case REPEATED_BLOCK: {
              //...sync list
              const meta = Placeholder.getMeta(node)
              const blocks = Blocks.get(node)
              const groupId = meta.id
              const prevIds = blocks.map(({ meta: { id } }) => id)
              const nextIds = value.map(({ $key }) => $key)

              const removals = prevIds
                .filter((id) => nextIds.includes(id) === false)
                .map((id) => blocks.find((block) => block.meta.id === id))

              removals.forEach(Blocks.remove)

              const nextBlocks = nextIds.map((id, i) => {
                if (id !== null) {
                  return (
                    blocks.find((block) => block.meta.id === id) ||
                    Blocks.create(value[i].t, { groupId, id })
                  )
                } else {
                  return blocks[i] || Blocks.create(value[i].t, { groupId, id })
                }
              })

              const lastNode = last(last(nextBlocks).nodes)

              let t = node

              nextBlocks.forEach((block, i) => {
                const firstChild = block.nodes[0]
                const lastChild = last(block.nodes)
                if (t.nextSibling !== firstChild) {
                  t.after(...block.nodes)
                }
                update(value[i], firstChild.nextSibling)
                t = lastChild
              })

              Placeholder.setMeta(node, {
                ...meta,
                length: nextBlocks.length,
              })

              return lastNode.nextSibling
            }
            default: {
              // NO PLACEHOLDER
              if (valueType === TEXT) {
                if (value !== node.textContent) {
                  node.textContent = value
                  break
                }
              }
            }
          }
        } else {
          if (placeholderType !== EMPTY) {
            // downgrade...
            switch (placeholderType) {
              case CONDITIONAL_BLOCK: {
                const blocks = ConditionalBlocks.get(node)
                blocks.forEach(ConditionalBlocks.remove)
                break
              }
            }

            const placeholder = Placeholder.create(EMPTY)
            node.replaceWith(placeholder)
            return placeholder.nextSibling
          }
        }
      }
    }
  })
}
