import { walk } from "./helpers.js"
import { hasMustache, getParts, stripPlaceholders } from "./token.js"

export const ATTRIBUTE = 0
export const TEXT = 1

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
    ...cache.get(key),
    v: values,
  }
}

function parse(str) {
  const div = document.createElement("div")
  div.innerHTML = str
  const map = {}

  let k = 0

  walk(div.firstChild, (node) => {
    k++

    switch (node.nodeType) {
      case node.TEXT_NODE: {
        const { textContent } = node

        if (!hasMustache(textContent)) return

        const parts = getParts(textContent)

        map[k] = map[k] || []
        map[k].push({
          type: TEXT,
          parts,
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

          map[k] = map[k] || []
          map[k].push({
            type: ATTRIBUTE,
            name,
            parts,
          })

          /* remove attribute now that we have parts mapped otherwise we'll get "unexpected value..." warnings when attaching SVG defs.
          we keep the text placeholders otherwise we risk losing the nodes once attached */
          node.setAttribute(name, stripPlaceholders(value))
        }
        break
      }
    }
  })

  return {
    t: div.innerHTML,
    m: map,
  }
}
