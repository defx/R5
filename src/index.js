import { configure } from "./store.js"
import { fragmentFromTemplate, walk } from "./helpers.js"

function _(value) {
  if (typeof value === "undefined") return ""
  return String(Array.isArray(value) ? value.join("") : value)
}

export const html = (strings, ...values) => {
  let c = 0
  let l = values.length

  const convert = () => {
    return `{{ ${c++} }}`
  }

  return strings
    .reduce((a, s, i) => {
      return a + s + (i < l ? convert() : ``)
    }, "")
    .trim()
}

export const define = (name, factory) => {
  if (customElements?.get(name)) return

  customElements.define(
    name,
    class extends HTMLElement {
      async connectedCallback() {
        let config = factory(this)

        if (config instanceof Promise) config = await config

        const { dispatch, getState, onChange, updated, refs } = configure(
          config,
          this
        )

        let state = getState()

        const content = config.render(state)
        const frag = fragmentFromTemplate(content)
        walk(frag.firstChild, (node) => {
          switch (node.nodeType) {
            case node.TEXT_NODE: {
              console.log("TEXT", node)
              break
            }
            case node.ELEMENT_NODE: {
              console.log("ELEMENT", node)
              break
            }
          }
        })
      }
    }
  )
}
