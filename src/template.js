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

export const update = (blueprint) => {
  const { t, v } = blueprint
  const rootNode = fromTemplate(t)
  walk(rootNode, (node) => {
    switch (node.nodeType) {
      case node.TEXT_NODE: {
        let value = node.textContent
        if (hasMustache(value)) {
          // this could be a simple text node, but it could also be a placeholder for a dynamic block (if|each)...you'll need to check the values to figure that out. if its another blueprint then its a dynamic block.
          //...it can also be mixed, as in some static text with a dynamic block in the middle, for example
          // for the time being lets assume that there's no mixed static content with dynamic blocks
          const parts = getParts(value)

          if (
            parts.every(
              ({ type, value }) => type === 1 || !isBlueprint(v[value])
            )
          ) {
            const nextVal = parts.reduce((a, { type, value }) => {
              return a + (type === 1 ? value : v[value])
            }, "")
            const prevVal = node.textContent

            if (prevVal !== nextVal) {
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
  return rootNode
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
