import { parse } from "./parse.js"

const cache = new Map()

export function html(strings, ...values) {
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
