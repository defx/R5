import { hasMustache, getParts, STATIC, DYNAMIC } from "./token.js"
import { treeWalker } from "./helpers.js"
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
    ...cache.get(key),
    v: values,
  }
}

function parse(str) {
  const map = {}

  let k = -1

  const template = document.createElement("template")
  template.innerHTML = str

  const walker = treeWalker(template.content)

  while (walker.nextNode()) {
    let node = walker.currentNode

    if (node.nodeType === Node.TEXT_NODE) {
      const { textContent } = node
      if (!hasMustache(textContent)) continue

      const parts = getParts(textContent)
      const frag = document.createDocumentFragment()

      for (const part of parts) {
        k += 1

        if (part.type === STATIC) {
          const text = document.createTextNode(part.value)
          frag.appendChild(text)
          walker.currentNode = text
        }
        if (part.type === DYNAMIC) {
          const placeholder = Placeholder.create("EMPTY")
          frag.appendChild(placeholder)
          walker.currentNode = placeholder

          map[k] = map[k] || []
          map[k].push({
            // type: TEXT,
            index: part.index,
          })
        }
      }

      node.parentNode.replaceChild(frag, node)

      continue
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      k += 1

      let attrs = [...node.attributes]
      let i = attrs.length

      while (i--) {
        let { name, value } = attrs[i]

        if (!hasMustache(value)) continue

        const parts = getParts(value)
        // const isKey = name === "@key"
        // const type = isKey ? KEY : ATTRIBUTE

        map[k] = map[k] || []
        map[k].push({
          type: ATTRIBUTE,
          name,
          parts,
        })

        node.removeAttribute(name)
      }
    }
  }

  return {
    m: map,
    t: template.innerHTML,
  }
}
