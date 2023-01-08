import { configure } from "./store.js"
import { fragmentFromTemplate } from "./helpers.js"
import { update } from "./template.js"

export { html } from "./template.js"

function _(value) {
  if (typeof value === "undefined") return ""
  return String(Array.isArray(value) ? value.join("") : value)
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

        // const originalRender = config.render

        // config.render = (x) => {
        //   return originalRender(x)
        // }

        const blueprint = config.render(getState())

        console.log(JSON.stringify(blueprint, null, 2))

        const node = update(blueprint)

        this.prepend(node)

        onChange(config.render)
      }
    }
  )
}
