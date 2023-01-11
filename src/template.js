import { last, walk } from "./helpers.js"
import { hasMustache, getParts } from "./token.js"

function reformat(str) {
  return str.replace(/\n|\s{2,}/g, "")
}

const blueprints = new WeakSet()

// @todo: cache strings
export const html = (strings, ...values) => {
  const l = values.length
  const tpl = strings
    .reduce((a, s, i) => {
      return a + s + (i < l ? `{{ ${i} }}` : ``)
    }, "")
    .trim()

  const x = {
    t: reformat(tpl),
    v: values,
  }
  blueprints.add(x)

  return x
}

function isBlueprint(v) {
  return blueprints.has(v)
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
  // convert to template...
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

export const update = (blueprint, rootNode) => {
  const { t, v } = blueprint

  walk(rootNode, (node) => {
    switch (node.nodeType) {
      case node.TEXT_NODE: {
        const parts = findParts(node)

        if (parts?.length === 1 && parts[0].type === 2) {
          const x = v[parts[0].value]
          if (!x || x.length === 0) {
            const template = asTemplate(``)
            const index = parts[0].value
            node.parentNode.replaceChild(template, node)
            placeholderCache.set(template, { index })
            return template.nextSibling
          }
        }

        if (parts) {
          if (
            parts.some(
              ({ value: i }) => Array.isArray(v[i]) && v[i].some(isBlueprint)
            )
          ) {
            return blockTemplate(node, v, parts[0].value)
          }

          const nextVal = parts.reduce((a, { type, value }) => {
            return a + (type === 1 ? value : v[value])
          }, "")

          if (node.textContent !== nextVal) {
            node.textContent = nextVal
          }
        }
        break
      }
      case node.ELEMENT_NODE: {
        if (node.nodeName === "TEMPLATE") {
          const pEntry = placeholderCache.get(node)

          if (pEntry) {
            const template = blockTemplate(node, v, pEntry.index)
            placeholderCache.delete(node)
            return template
          }

          const cacheEntry = rbCache.get(node)
          const value = v[cacheEntry.index]

          if (Array.isArray(value)) {
            const { index, key, values: prevVals = [], blockSize } = cacheEntry

            const nextVals = v[index].map(({ v }) => v)

            if (key === undefined) {
              console.warn("ignoring list without keys", node.innerHTML)
              break
            }

            const prevKeys = prevVals.map((v) => v[key])
            const nextKeys = nextVals.map((v) => v[key])

            if (nextKeys.some((v) => v === undefined)) {
              console.warn(
                `You are trying to re-render a list but one or more of your list keys are undefined!`
              )
              return false
            }

            const delta = nextKeys.map((b) =>
              prevKeys.findIndex((a) => a === b)
            )
            listSync(node, delta, blockSize)
            const listItems = elementSiblings(node, delta.length, blockSize)

            listItems.forEach((items, i) =>
              items.forEach((item) => update(v[index][i], item))
            )

            rbCache.set(node, { ...cacheEntry, values: nextVals })

            return last(last(listItems))?.nextSibling
          } else {
            console.log("render conditional block...", node)
          }
        }

        let attrs = [...node.attributes]
        let i = attrs.length
        while (i--) {
          let { name, value } = attrs[i]

          const parts = getParts(value)
          if (parts) {
            const nextVal = parts.reduce((a, { type, value }) => {
              return a + (type === 1 ? value : v[value])
            }, "")
            if (node.getAttribute(name) !== nextVal) {
              node.setAttribute(name, nextVal)
            }
          }
        }
        break
      }
    }
  })
}
