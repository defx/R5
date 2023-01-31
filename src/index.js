import { configure } from "./store.js"
import { update } from "./dom.js"

export { html } from "./template.js"

function templateNodeFromString(str) {
  let node = document.createElement("template")
  node.innerHTML = str.trim()
  return node
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
        const frag = templateNodeFromString(blueprint.t).content.cloneNode(true)

        update(blueprint, frag)

        this.prepend(frag)

        onChange((state) => update(config.render(state), this))

        this.$dispatch = dispatch
      }
    }
  )
}
