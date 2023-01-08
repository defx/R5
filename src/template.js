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

function fromTemplate(str) {
  let tpl = document.createElement("template")
  tpl.innerHTML = str.trim()
  return tpl.content.cloneNode(true)
}

const cache = new WeakMap()

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

export const update = (blueprint, parentNode) => {
  const { t, v } = blueprint
  const rootNode = findNode(parentNode, t)

  walk(rootNode, (node) => {
    switch (node.nodeType) {
      case node.TEXT_NODE: {
        const parts = findParts(node)

        if (parts) {
          if (
            parts.every(
              ({ type, value }) => type === 1 || !isBlueprint(v[value])
            )
          ) {
            const nextVal = parts.reduce((a, { type, value }) => {
              return a + (type === 1 ? value : v[value])
            }, "")

            if (node.textContent !== nextVal) {
              node.textContent = nextVal
            }
          }
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
