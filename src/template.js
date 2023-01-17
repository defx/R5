import { walk } from "./helpers.js"
import { hasMustache, getParts } from "./token.js"

const blueprints = new WeakSet()

function isBlueprint(v) {
  return blueprints.has(v)
}

export const ATTRIBUTE = 0
export const TEXT = 1

export function html(strings, ...values) {
  const l = values.length
  const xtpl = strings
    .reduce((a, s, i) => {
      return a + s + (i < l ? `{{ ${i} }}` : ``)
    }, "")
    .trim()

  const map = parse(xtpl)
  const tpl = strings.join("").trim()

  const x = {
    t: tpl,
    v: values,
    map,
  }
  blueprints.add(x)

  return x
}

function parse(str) {
  const div = document.createElement("div")
  div.innerHTML = str
  const map = {}

  let i = 0

  walk(div.firstChild, (node) => {
    i++

    switch (node.nodeType) {
      case node.TEXT_NODE: {
        const { textContent } = node
        if (!hasMustache(textContent) === false) return

        const parts = getParts(textContent)

        map[i] = map[i] || []
        map[i].push({
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

          if (parts) {
            map[i] = map[i] || []
            map[i].push({
              type: ATTRIBUTE,
              name,
              parts,
            })
          }
        }
        break
      }
    }
  })

  return map
}
