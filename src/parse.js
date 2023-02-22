import { ATTRIBUTE, EMPTY, EVENT, TEXT } from "../src/constants.js"

const getParts = (value) =>
  value
    .trim()
    .split(/({{[^{}]+}})/)
    .filter((v) => v)
    .map((value) => {
      let match = value.match(/{{([^{}]+)}}/)
      return match ? [1, +match[1].trim()] : [0, value]
    })

export function parse(strings) {
  const m = {}

  let html = ""
  let openAttr = false
  let attrName
  let attrVal

  function map(type, index, html) {
    const tags = (html.match(/(<[\w!])/g) || []).length
    const text = (html.match(/(>[^<]+<)/g) || []).length
    const k = tags + text - 1

    const entry = {}
    if (type === ATTRIBUTE) {
      if (attrName.startsWith("on")) {
        type = EVENT
        html = html.replace(new RegExp(`\s?${attrName}=['"].+['"]\s?`), "")
        attrName = attrName.slice(2)
        entry.index = index
      } else {
        entry.parts = getParts(attrVal)
      }
      entry.name = attrName
    }
    if (type === TEXT) {
      entry.index = index
    }
    entry.type = type
    m[k] = m[k] || []
    m[k].push(entry)

    return html
  }

  strings.forEach((str, i) => {
    html += str

    let alreadyOpen = openAttr

    if (openAttr) {
      const m = str.match(/([\s\w]*)['"]/)

      openAttr = !!!m
      if (!openAttr) {
        attrVal += m[1]
        html = map(ATTRIBUTE, i - 1, html)
      }
    } else {
      const m = str.match(/(\w+-?\w+)=['"]{1}([^'"]*)$/)
      if (m) {
        attrName = m[1]
        attrVal = m[2]
      }
      openAttr = !!m
    }

    if (i === strings.length - 1) return

    if (openAttr) {
      const token = alreadyOpen ? str + `{{${i}}}` : `{{${i}}}`
      html += token
      attrVal += token
    } else {
      html += `<!--{{${EMPTY}}}-->`
      html = map(TEXT, i, html)
    }
  })

  // ...
  return { m, t: html }
}
