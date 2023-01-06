function _(value) {
  if (typeof value === "undefined") return ""
  return String(Array.isArray(value) ? value.join("") : value)
}

export const html = (strings, ...values) => {
  let c = 0
  let l = values.length

  return strings
    .reduce((a, s, i) => {
      return a + s + (i < l ? `{{ ${c++} }}` : ``)
    }, "")
    .trim()
}
