import { last, walk } from "./helpers.js"
import { hasMustache, getParts } from "./token.js"
import { TEXT, ATTRIBUTE } from "./template.js"

function isBlueprint(v) {
  // @todo
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

export const update = (blueprint, rootNode) => {
  // console.log(JSON.stringify(blueprint.m, null, 2))
  const { m, v } = blueprint
  let i = -1
  walk(rootNode, (node) => {
    i++

    const entries = m[i]

    if (!entries) return

    for (const entry of entries) {
      switch (entry.type) {
        case TEXT: {
          const nextVal = entry.parts.reduce((a, { type, value }) => {
            if (type === 1) return a + value

            const x = v[value]

            if (isNaN(x) && (!x || x.length === 0)) {
              return a
            }

            return a + x
          }, "")

          let targetNode = [...node.childNodes][entry.childIndex]

          if (targetNode.textContent !== nextVal) {
            targetNode.textContent = nextVal
          }
          break
        }
        case ATTRIBUTE: {
          const nextVal = entry.parts.reduce((a, { type, value }) => {
            return a + (type === 1 ? value : v[value])
          }, "")

          if (node.getAttribute(entry.name) !== nextVal) {
            node.setAttribute(entry.name, nextVal)
          }
          break
        }
      }
    }
  })
}

export const xupdate = (blueprint, rootNode) => {
  const { t, v } = blueprint

  walk(rootNode, (node) => {
    switch (node.nodeType) {
      case node.TEXT_NODE: {
        let parts = findParts(node)

        if (!parts) break

        for (const [i, part] of Object.entries(parts)) {
          if (!isBlueprint(v[part.value]?.[0] || v[part.value])) continue

          let newParts

          /* update parts for this node */
          if (i) {
            const partsBefore = parts.slice(0, i)
            cache.set(node, partsBefore)
            newParts = partsBefore
          }

          /* create the placeholder */
          const template = asTemplate(``)
          node.after(template)
          placeholderCache.set(template, { index: part.value })

          if (i < parts.length - 1) {
            const partsAfter = parts.slice(+i + 1)
            const textNode = document.createTextNode(`*`)

            cache.set(textNode, partsAfter)
            template.after(textNode)
          }

          parts = newParts

          break
        }

        const nextVal = parts.reduce((a, { type, value }) => {
          if (type === 1) return a + value

          const x = v[value]

          if (isNaN(x) && (!x || x.length === 0)) {
            return a
          }

          return a + x
        }, "")

        if (node.textContent !== nextVal) {
          node.textContent = nextVal
        }

        break
      }
      case node.ELEMENT_NODE: {
        if (node.nodeName === "TEMPLATE") {
          const pEntry = placeholderCache.get(node)

          if (pEntry) {
            if (!v[pEntry.index]) return node.nextSibling

            const template = blockTemplate(node, v, pEntry.index)

            placeholderCache.delete(node)
            return template
          }

          const cacheEntry = rbCache.get(node)
          const value = v[cacheEntry.index]

          if (Array.isArray(value)) {
            const { index, key, values: prevVals = [], blockSize } = cacheEntry
            const nextVals = v[index].map(({ v }) => v)
            const delta = compareKeyedLists(
              key,
              Object.entries(prevVals),
              Object.entries(nextVals)
            )

            listSync(node, delta, blockSize)
            const listItems = elementSiblings(node, delta.length, blockSize)

            listItems.forEach((items, i) =>
              items.forEach((item) => update(v[index][i], item))
            )

            rbCache.set(node, { ...cacheEntry, values: nextVals })

            return last(last(listItems))?.nextSibling
          } else {
            // console.log("render conditional block...", node, value)

            const shouldRender = !!value
            const attached = node.getAttribute("attached") === "true"
            const { blockSize } = cacheEntry

            if (shouldRender !== attached) {
              if (shouldRender) {
                const n = fromTemplate(value.t)
                update(value.v, n)
                node.after(n)
              } else {
                elementSiblings(node, 1, blockSize)[0].forEach((el) =>
                  el.remove()
                )
              }
            }

            node.setAttribute("attached", shouldRender)
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
