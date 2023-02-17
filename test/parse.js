function parse(strings) {
  const m = {}

  let html = ""
  let openAttr = false

  strings.forEach((str, i) => {
    if (openAttr) {
      openAttr = !!!str.match(/['"]/)
    } else {
      openAttr = !!str.match(/\w+=['"]{1}[^'"]*$/)
    }

    html += str

    if (i === strings.length - 1) return

    if (openAttr) {
      // ...
    } else {
      html += `<!--$-->`
    }

    const tags = (html.match(/(<[\w!])/g) || []).length
    const text = (html.match(/(>[^<]+<)/g) || []).length
    const nodes = tags + text
    const type = openAttr ? "ATTRIBUTE" : "TEXT"

    console.log(html, {
      type,
      i: nodes,
    })
  })

  // ...
  return { m, t: html }
}

describe("parse", () => {
  it("...", () => {
    const html = `<section><p class="{{0}} foo">{{1}}and{{2}}</p>{{3}}<a onclick='{{4}}'>{{5}}and{{6}}</a></section><span>{{7}}</span>`

    const parts = [
      `<section><p class="`,
      ` foo">`,
      `and`,
      `</p>`,
      `<a onclick='`,
      `'>`,
      `and`,
      `</a></section><span>`,
      `</span>`,
    ]

    const { m, t } = parse(parts)

    console.log(t, JSON.stringify(m, null, 2))
  })
})
