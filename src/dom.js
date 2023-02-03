import { last, walk, treeWalker } from "./helpers.js"
import { hasMustache, getParts } from "./token.js"
import { TEXT, ATTRIBUTE } from "./template.js"
import { STATIC, DYNAMIC } from "./token.js"
import * as Placeholder from "./placeholder.js"
import * as Blocks from "./blocks.js"
import {
  EMPTY,
  REPEATED_BLOCK,
  BLOCK_OPEN,
  BLOCK_CLOSE,
} from "./placeholder.js"

function isTemplateResult(v) {
  return Object.keys(v).sort().join(".") === "m.t.v"
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

const blockSize = (template) => {
  let i = 0
  walk(template.content?.firstChild || template.firstChild, () => i++, false)
  return i
}

const elementSiblings = (node, n, blockSize) => {
  const siblings = []
  let t = node
  while (n--) {
    let nodes = []
    let x = blockSize
    while (x--) {
      nodes.push(t.nextElementSibling)
      t = last(nodes)
    }
    siblings.push(nodes)
  }
  return siblings
}

function lastChild(v) {
  if (Array.isArray(v)) return last(v)
  return (v.nodeType === v.DOCUMENT_FRAGMENT_NODE && v.lastChild) || v
}

function firstChild(v) {
  if (Array.isArray(v)) return v[0]
  return (v.nodeType === v.DOCUMENT_FRAGMENT_NODE && v.firstChild) || v
}

function appendable(v) {
  if (Array.isArray(v)) {
    const frag = document.createDocumentFragment()
    v.forEach((node) => frag.append(node))
    return frag
  }
  return v
}

function listSync(template, delta, blockSize) {
  let n = +(template.dataset.length || 0)
  const unchanged = delta.length === n && delta.every((a, b) => a == b)

  if (unchanged) return

  const blocks = elementSiblings(template, n, blockSize)
  let t = template

  delta.forEach((i, newIndex) => {
    let el = i === -1 ? template.content.cloneNode(true) : blocks[i]
    let x = lastChild(el)

    if (t.nextElementSibling !== firstChild(el)) {
      t.after(appendable(el))
    }
    t = x
  })

  template.dataset.length = delta.length

  return t
}

const cache = new WeakMap()
const rbCache = new WeakMap()
const placeholderCache = new WeakMap()

function findParts(node) {
  if (!cache.has(node) && hasMustache(node.textContent)) {
    cache.set(node, getParts(node.textContent))
  }
  return cache.get(node)
}

function getTemplateKey(template) {
  const node = template.hasAttribute("@key")
    ? template
    : template.content.firstElementChild

  const k = node.getAttribute?.("@key")
  if (k) {
    const vi = +k.match(/{{([^{}]+)}}/)[1]
    node.removeAttribute("@key")
    return vi
  }
}

function blockTemplate(node, v, i) {
  const template = asTemplate(v[i].t || v[i][0].t)
  const key = getTemplateKey(template)
  const index = i
  node.parentNode.replaceChild(template, node)

  rbCache.set(template, {
    index,
    key,
    blockSize: blockSize(template),
  })
  return template
}

const compareKeyedLists = (key, a = [], b = []) => {
  let delta = b.map(([k, item]) =>
    !key ? (k in a ? k : -1) : a.findIndex(([_, v]) => v[key] === item[key])
  )
  if (a.length !== b.length || !delta.every((n, i) => n === i)) return delta
}

/*

for this we can cache the node reference so that we only need to walk once

*/

function truthy(v) {
  return v === 0 || v
}

function typeOfValue(v) {
  if (Array.isArray(v) && isTemplateResult(v[0])) {
    return REPEATED_BLOCK
  }

  return TEXT
}

// @todo: cache the node refs so that we only walk the whole tree on the first update
export const update = (templateResult, rootNode) => {
  const { m, v } = templateResult

  console.log(m, rootNode)

  let k = -1

  walk(rootNode, (node) => {
    k += 1

    if (k in m === false) return

    for (const entry of m[k]) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const { name, parts } = entry

        const value = parts.reduce((a, part) => {
          if (part.type === DYNAMIC) {
            return a + v[part.index]
          }
          if (part.type === STATIC) {
            return a + part.value
          }
          return a
        }, "")

        if (node.getAttribute(name) !== value) {
          node.setAttribute(name, value)
        }
      } else {
        // TEXT,  COMMENT
        const value = v[entry.index]
        const valueType = typeOfValue(value)
        const { nodeType } = node
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
                node = placeholder
                placeholderType = REPEATED_BLOCK
              }
            }

            case REPEATED_BLOCK: {
              //...sync list
              const meta = Placeholder.getMeta(node)
              const blocks = Blocks.get(node)
              const groupId = meta.id
              const prevIds = blocks.map(({ id }) => id)
              const nextIds = value.map(({ m, v }) => v[m[0].id])
              const removals = prevIds
                .filter((id) => nextIds.includes(id) === false)
                .map((id) => blocks.find((block) => block.id === id))

              removals.forEach(Blocks.remove)

              const nextBlocks = nextIds.map(
                (id, i) =>
                  blocks.find((block) => block.id === id) ||
                  Blocks.create(groupId, id, value[i].t)
              )

              const lastBlock = last(nextBlocks)
              const lastNode = lastBlock.lastChild || last(lastBlock)

              let t = node

              nextBlocks.forEach((block, i) => {
                const { firstChild, lastChild } = block
                if (t.nextSibling !== firstChild) {
                  Blocks.after(t, block)
                  update(value[i], firstChild.nextSibling)
                }
                t = lastChild
              })

              return lastNode.nextSibling
            }
            // case BLOCK_OPEN: {
            //   console.log(BLOCK_OPEN, node)
            //   break
            // }
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
            const placeholder = Placeholder.create(EMPTY)
            node.replaceWith(placeholder)
            return placeholder.nextSibling
            // walker.currentNode = placeholder
            // break
          }
        }
      }
    }
  })
}
