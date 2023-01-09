import { walk } from "./helpers.js"
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
  return tpl
}

function fromTemplate(str) {
  return asTemplate(str).content.cloneNode(true)
}

const blockSize = (template) => {
  let i = 0
  walk(template.content?.firstChild || template.firstChild, () => i++, false)
  return i
}

const elementSiblings = (node, n) => {
  const siblings = []
  let t = node
  while (n--) {
    const next = t.nextElementSibling
    siblings.push(next)
    t = next
  }
  return siblings
}

/*

@mvp: just make it work for single top-level node first

*/

function listSync(template, delta) {
  let n = +(template.dataset.length || 0)
  const unchanged = delta.length === n && delta.every((a, b) => a == b)

  if (unchanged) return

  const blocks = elementSiblings(template, n)

  let t = template

  delta.forEach((i, newIndex) => {
    let el = i === -1 ? template.content.cloneNode(true).firstChild : blocks[i]

    t.after(el)
    t = el
  })

  return t
}

const cache = new WeakMap()
const rbCache = new WeakMap()

function findParts(node) {
  if (!cache.has(node) && hasMustache(node.textContent)) {
    cache.set(node, getParts(node.textContent))
  }
  return cache.get(node)
}

function findNode(parentNode, template) {
  if (!cache.has(parentNode)) {
    const rootNode = fromTemplate(template)
    cache.set(parentNode, rootNode)
  }
  return cache.get(parentNode)
}

function getTemplateKey(template) {
  const node = template.content.firstElementChild
  const k = node.getAttribute?.("@key")
  if (k) {
    const vi = +k.match(/{{([^{}]+)}}/)[1]
    node.removeAttribute("@key")
    return vi
  }
}

export const update = (blueprint, parentNode) => {
  const { t, v } = blueprint
  const rootNode = findNode(parentNode, t)

  walk(rootNode, (node) => {
    switch (node.nodeType) {
      case node.TEXT_NODE: {
        const parts = findParts(node)

        if (parts) {
          if (
            parts.some(
              ({ value: i }) => Array.isArray(v[i]) && v[i].some(isBlueprint)
            )
          ) {
            // convert to template...
            const template = asTemplate(v[parts[0].value][0].t)
            const key = getTemplateKey(template)
            const index = parts[0].value
            node.parentNode.replaceChild(template, node)
            rbCache.set(template, {
              index,
              key,
              blockSize: blockSize(template),
            })
            return template
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
          const {
            index,
            key,
            values: prevVals = [],
            blockSize,
          } = rbCache.get(node)

          const nextVals = v[index].map(({ v }) => v)

          if (key === undefined) {
            console.warn("ignoring list without keys", node.innerHTML)
            break
          }

          const prevKeys = prevVals.map((v) => v[key])
          const nextKeys = nextVals.map((v) => v[key])
          const delta = nextKeys.map((b) => prevKeys.findIndex((a) => a === b))
          const lastNode = listSync(node, delta)

          rbCache.set(node, { index, key, values: nextVals })

          return lastNode.nextSibling
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
  parentNode.prepend(rootNode)
}

export const xparse = (rootNode, subscribers = []) => {
  walk(rootNode, (node) => {
    switch (node.nodeType) {
      case node.TEXT_NODE: {
        let value = node.textContent
        if (hasMustache(value)) {
          const parts = getParts(value)
          let prevVal
          subscribers.push((values) => {
            const nextVal = parts.reduce((a, { type, value }) => {
              return a + (type === 1 ? value : values[value])
            }, "")

            if (nextVal !== prevVal) {
              node.textContent = nextVal
            }
            prevVal = nextVal
          })
        }
        break
      }
      case node.ELEMENT_NODE: {
        let attrs = [...node.attributes]
        let i = attrs.length
        while (i--) {
          let { name, value } = attrs[i]
          if (hasMustache(value)) {
            const parts = getParts(value)
            let prevVal
            subscribers.push((values) => {
              const nextVal = parts.reduce((a, { type, value }) => {
                return a + (type === 1 ? value : values[value])
              }, "")

              if (nextVal !== prevVal) {
                node.setAttribute(name, nextVal)
              }
              prevVal = nextVal
            })
          }
        }
        break
      }
    }
  })

  return subscribers
}
