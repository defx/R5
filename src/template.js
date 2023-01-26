import { walk } from "./helpers.js"
import { hasMustache, getParts, stripPlaceholders } from "./token.js"

export const ATTRIBUTE = "ATTRIBUTE"
export const TEXT = "TEXT"
export const KEY = "KEY"

function last(v) {
  return v[v.length - 1]
}

function withPlaceholders(strings) {
  return (
    strings.slice(0, -1).reduce((a, s, i) => {
      return a + s + `{{ ${i} }}`
    }, "") + last(strings)
  ).trim()
}

const cache = new Map()

export function html(strings, ...values) {
  const key = strings.join("").trim()

  if (!cache.has(key)) {
    cache.set(key, parse(withPlaceholders(strings)))
  }

  return {
    m: cache.get(key),
    t: key,
    v: values,
  }
}

function childIndex(node) {
  return Array.from(node.parentNode.childNodes).indexOf(node)
}

function parse(str) {
  const div = document.createElement("div")
  div.innerHTML = str

  const lookup = new WeakMap()
  const map = {}

  let k = -1

  walk(div, (node) => {
    k++

    lookup.set(node, k)

    switch (node.nodeType) {
      case node.TEXT_NODE: {
        // console.log("TEXT", node)

        const { textContent } = node

        if (!hasMustache(textContent)) return

        const parts = getParts(textContent)

        let j = lookup.get(node.parentNode)

        map[j] = map[j] || []
        map[j].push({
          type: TEXT,
          parts,
          childIndex: childIndex(node),
        })

        break
      }
      case node.ELEMENT_NODE: {
        let attrs = [...node.attributes]
        let i = attrs.length
        while (i--) {
          let { name, value } = attrs[i]

          if (!hasMustache(value)) continue

          const parts = getParts(value)
          const isKey = name === "@key"
          const type = isKey ? KEY : ATTRIBUTE

          map[k] = map[k] || []
          map[k].push({
            type,
            name,
            parts,
          })

          /* remove attribute now that we have parts mapped otherwise we'll get "unexpected value..." warnings when attaching SVG defs.
          we keep the text placeholders otherwise we risk losing the nodes once attached */
          if (isKey) {
            node.removeAttribute(name)
          } else {
            node.setAttribute(name, stripPlaceholders(value))
          }
        }

        console.log("TPL:ELEMENT", [...node.childNodes])

        break
      }
    }
  })

  return map
}
