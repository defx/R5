import { last, walk, treeWalker } from "./helpers.js"
import { hasMustache, getParts } from "./token.js"
import { TEXT, ATTRIBUTE } from "./template.js"
import { STATIC, DYNAMIC } from "./token.js"
import * as Placeholder from "./placeholder.js"

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
  if (a.length !== b.length || !delta.every((a, b) => a === b)) return delta
}

/*

for this we can cache the node reference so that we only need to walk once

*/

function truthy(v) {
  return v === 0 || v
}

const REPEATED_BLOCK = "REPEATED_BLOCK"

function valueType(v) {
  if (Array.isArray(v) && isTemplateResult(v[0])) {
    return REPEATED_BLOCK
  }

  return TEXT
}

// @todo: cache the node refs so that we only walk the whole tree on the first update
export const update = (templateResult, rootNode) => {
  const walker = treeWalker(rootNode)
  const { m, v } = templateResult

  let k = -1

  while (walker.nextNode()) {
    k += 1
    let node = walker.currentNode
    if (k in m === false) continue

    // console.log(node, m[k], v)

    /*
    
    for any nodeType other than comment, if the value is falsy then we need to swap for a placeholder...
    
    */

    for (const entry of m[k]) {
      switch (node.nodeType) {
        case Node.COMMENT_NODE: {
          let placeholderType = Placeholder.type(node)

          if (!placeholderType) continue

          const value = v[entry.index]

          if (!truthy(value)) continue

          const type = valueType(value)

          console.log({ placeholderType })

          if (placeholderType === "EMPTY" && type === TEXT) {
            // swap placeholder for node
            const textNode = document.createTextNode(value)
            node.replaceWith(textNode)
            walker.currentNode = textNode
            break
          }

          if (placeholderType === "EMPTY" && type === REPEATED_BLOCK) {
            /*
            
            the previous implementation created a template node, but that approach incorrectly assumes that the same list template will always be used. the template needs to be processed node by node.

            what if...instead of removing the placeholder, you update its content to identify it as a list placeholder?

            but wait, is it correct to assume that this will be a list next time? no, the type should always be driven off the value. that's fine though, when we swap to a list then we update the placeholder to identify this. this allows us to correctly tear down the list if/when we need to swap to another type/placeholder.

            */
            const rbPlaceholder = Placeholder.create("REPEATED_BLOCK")

            node.replaceWith(rbPlaceholder)
            node = rbPlaceholder
            placeholderType = "REPEATED_BLOCK"
          }

          if (placeholderType === "REPEATED_BLOCK") {
            console.log("REPEATED_BLOCK", node, value)
          }
        }
        case Node.TEXT_NODE: {
          const value = v[entry.index]
          if (!truthy(value)) {
            // swap node for placeholder
          }
          break
        }
        case Node.ELEMENT_NODE: {
          if (entry.type === ATTRIBUTE) {
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
          }
          break
        }
      }
    }
  }
}
