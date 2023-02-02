import { configure } from "./store.js"
import { update } from "./dom.js"
import { templateNodeFromString } from "./helpers.js"

export { html } from "./template.js"

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

        const result = config.render(getState())
        const frag = templateNodeFromString(result.t).content.cloneNode(true)

        update(result, frag)

        this.prepend(frag)

        onChange((state) => update(config.render(state), this))

        this.$dispatch = dispatch
      }
    }
  )
}
