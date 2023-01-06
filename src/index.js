import { configure } from "./store.js"
import { fragmentFromTemplate, walk } from "./helpers.js"
import { hasMustache, parseMustache } from "./token.js"

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

  const subscribers = []

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
              let value = node.textContent
              if (hasMustache(value)) {
                const i = +parseMustache(value)
                let prevVal
                subscribers.push((values) => {
                  const nextVal = values[i]
                  if (nextVal !== prevVal) {
                    node.textContent = nextVal
                  }
                  prevVal = nextVal
                })
              }
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
