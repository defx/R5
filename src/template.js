import { parse } from "./parse.js"

const cache = new Map()

/*

<p class="${"foo"} to ${"bar"}">to ${"baz"}</p>

->

<!-- ** -->
<p class="foo to bar">to <!-- * -->baz</p>


*/

function html(strings, ...values) {
  const L = values.length - 1

  const markup = strings.reduce((markup, string, i) => {
    if (i > L) return markup + string
    const isAttr = string.match(/(\w+-?\w+)=['"]{1}([^'"]*)$/)

    if (isAttr) {
      /*
      
      @todo: inject comment before the last tag
      
      */
      return markup + string + values[i]
    }

    return markup + string + "<!-- * -->" + values[i]
  }, "")

  return markup
}

export function xhtml(strings, ...values) {
  const key = strings.join("%")

  if (!cache.has(key)) {
    cache.set(key, parse(strings))
  }

  return {
    $key: null,
    ...cache.get(key),
    v: values,
    key(k) {
      this.$key = k
      return this
    },
  }
}
