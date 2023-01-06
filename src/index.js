import { configure } from "./store.js"
import { fragmentFromTemplate, walk } from "./helpers.js"
import { hasMustache, parseMustache } from "./token.js"

function _(value) {
  if (typeof value === "undefined") return ""
  return String(Array.isArray(value) ? value.join("") : value)
}

let xvalues

export const html = (strings, ...values) => {
  xvalues = values

  let l = values.length
  return strings
    .reduce((a, s, i) => {
      return a + s + (i < l ? values[i] : ``)
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

        let c = 0

        const { dispatch, getState, onChange, updated, refs } = configure(
          config,
          this
        )

        const content = config.render(
          new Proxy(
            {},
            {
              get() {
                return `{{ ${c++} }}`
              },
            }
          )
        )
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
              // @todo
              break
            }
          }
        })

        const originalRenderFn = config.render

        config.render = (state) => {
          let v = originalRenderFn(state)
          subscribers.forEach((fn) => fn(xvalues))
          xvalues = null
          return v
        }

        config.render(getState())

        this.prepend(frag)

        setTimeout(() => {
          config.render({ message: "goodbye!" })
        }, 1000)
      }
    }
  )
}
