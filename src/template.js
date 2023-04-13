function stars(n) {
  return new Array(n).fill("*").join("")
}

function value(v) {
  if (v) {
    if (v.hasOwnProperty("markup")) return `<!--#${v.id}-->${v.markup}`
    if (Array.isArray(v)) {
      return `<!--{-->${v.map(value).join("")}<!--}-->`
    }
  }

  return `<!--{-->${v}<!--}-->`
}

export function html(strings, ...values) {
  const L = values.length - 1
  let p = -1
  const events = new Set()

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
        if (isAttributeValue[1].startsWith("on")) {
          const type = isAttributeValue[1].slice(2)
          events.add(type)
          str = str.replace(/\s(on[\w]+=['""'])$/, " data-$1")
          return str + i
        }

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

    if (string.startsWith("<textarea")) {
      return markup + "<!--{-->" + string + values[i]
    }

    return str + value(values[i])
  }, "")

  return Object.assign(markup, {
    markup,
    strings,
    values,
    events,
    key(v) {
      this.id = v
      return this
    },
  })
}
