import { configure } from "./store.js"

import { update, fromTemplate } from "./template.js"

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

        const blueprint = config.render(getState())
        const frag = fromTemplate(blueprint.t)
        const rootNode = frag.firstChild

        update(blueprint, rootNode)

        this.prepend(frag)

        onChange((state) => {
          const blueprint = config.render(state)
          update(blueprint, rootNode)
        })

        this.$dispatch = dispatch
      }
    }
  )
}
