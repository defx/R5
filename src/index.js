import { configure } from "./store.js"
import { fragmentFromTemplate } from "./helpers.js"
import { parse } from "./parse.js"

function _(value) {
  if (typeof value === "undefined") return ""
  return String(Array.isArray(value) ? value.join("") : value)
}

function reformat(str) {
  return str.replace(/\n|\s{2,}/g, "")
}

const cache = {}

export const html = (strings, ...values) => {
  const k = strings.join("")

  if (!(k in cache)) {
    let l = values.length
    const tpl = strings
      .reduce((a, s, i) => {
        return a + s + (i < l ? `{{ ${i} }}` : ``)
      }, "")
      .trim()
    cache[k] = reformat(tpl)
  }

  return {
    tpl: cache[k],
    values,
  }
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

        const x = config.render(getState())

        console.log(x)

        // this.prepend(frag)

        onChange(config.render)
      }
    }
  )
}
