import { parse } from "./parse.js"

const cache = new Map()

/*

<p class="${"foo"} to ${"bar"}">to ${"baz"}</p>

->

<!-- ** -->
<p class="foo to bar">to <!-- * -->baz</p>


*/

function stars(n) {
  return new Array(n).fill("*").join("")
}

function value(v) {
  if (v) {
    if (v.hasOwnProperty("markup")) return `<!--#${v.id}-->${v.markup}`
    if (Array.isArray(v)) {
      // probs need to wrap this with two comments
      return `<!--{-->${v.map(value).join("")}<!--}-->`
    }
  }

  return `<!--{-->${v}<!--}-->`
}

export function html(strings, ...values) {
  const L = values.length - 1
  let p = -1

  const markup = strings.reduce((markup, string, i) => {
    let str = markup + string

    if (i > L) return str

    const isElement = str.match(/<[^\/>]+$/)
    const isAttributeValue = str.match(/(\w+-?\w+)=['"]{1}([^'"]*)$/)

    if (isElement) {
      const startOpenTag = str.lastIndexOf("<")
      const placeholder = str.slice(0, startOpenTag).match(/<!--(\*+)-->$/)

      if (placeholder) {
        const n = placeholder[1].length
        str =
          str
            .slice(0, startOpenTag)
            .replace(/<!--(\*+)-->$/, `<!--${stars(n + 1)}-->`) +
          str.slice(startOpenTag)
      } else {
        str = str.slice(0, startOpenTag) + `<!--*-->` + str.slice(startOpenTag)
        p++
      }

      if (isAttributeValue) {
        return str + values[i]
      } else {
        const v = values[i]
        if (values[i]) {
          return str + `${v}`
        } else {
          return str
        }
      }
    }

    return str + value(values[i])
  }, "")

  return {
    markup,
    strings,
    values,
    key(v) {
      this.id = v
      return this
    },
  }
}

// html`<div>${"0"}</div><p class="${"foo"} bar ${"baz"}">${"1"}</p>`

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
