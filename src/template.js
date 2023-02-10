import { hasMustache, getParts, STATIC, DYNAMIC } from "./token.js"
import { walk } from "./helpers.js"
import * as Placeholder from "./placeholder.js"

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
  const key = strings.join("{{ ? }}").trim()

  if (!cache.has(key)) {
    cache.set(key, parse(withPlaceholders(strings)))
  }

  return {
    $key: null,
    ...cache.get(key),
    v: values,
    key(k) {
      this.$key = k
      return this
    },
  }
}

function parse(str) {
  const map = {}

  let k = -1

  const template = document.createElement("template")
  template.innerHTML = str.replace(/\n\s*/gm, "")

  walk(template.content.firstChild, (node) => {
    k += 1

    if (node.nodeType === Node.TEXT_NODE) {
      const { textContent } = node
      if (!hasMustache(textContent)) {
        return
      }

      const parts = getParts(textContent)
      const frag = document.createDocumentFragment()

      let k2 = k

      for (const [i, part] of Object.entries(parts)) {
        k = k2 + +i

        if (part.type === STATIC) {
          const text = document.createTextNode(part.value)
          frag.appendChild(text)
        }
        if (part.type === DYNAMIC) {
          const placeholder = Placeholder.create("EMPTY")
          frag.appendChild(placeholder)

          map[k] = map[k] || []
          map[k].push({
            index: part.index,
          })
        }
      }

      const nextSibling = node.nextSibling || node.parentNode.nextSibling

      node.parentNode.replaceChild(frag, node)

      return nextSibling
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      let attrs = [...node.attributes]
      let i = attrs.length

      while (i--) {
        let { name, value } = attrs[i]

        if (!hasMustache(value)) return

        const parts = getParts(value)

        map[k] = map[k] || []
        map[k].push({
          type: ATTRIBUTE,
          name,
          parts,
        })

        node.removeAttribute(name)
      }
    }
  })

  return {
    m: map,
    t: template.innerHTML,
  }
}
