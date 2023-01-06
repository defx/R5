import { configure } from "./store.js"
import { fragmentFromTemplate } from "./helpers.js"
import { parse } from "./parse.js"

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
        const subscribers = parse(frag.firstChild)
        const originalRenderFn = config.render

        config.render = (state) => {
          const v = originalRenderFn(state)
          subscribers.forEach((fn) => fn(xvalues))
          xvalues = null
          return v
        }

        config.render(getState())

        this.prepend(frag)

        onChange(config.render)

        // setTimeout(() => {
        //   config.render({ message: "goodbye!" })
        // }, 1000)
      }
    }
  )
}
