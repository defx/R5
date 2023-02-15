const parts = [
  `<p class="`,
  `{{0}}`,
  `">`,
  `{{1}}`,
  `</p>`,
  `{{2}}`,
  `<a onclick='`,
  `{{3}}`,
  `'>`,
  `{{4}}`,
  `</a>`,
]

function parse(str) {
  const m = {}
  const parts = str.split(/{{(\d)}}/gm)
  //   console.log(parts)
  parts.forEach((x, i) => {
    if (isNaN(x)) return

    const n = +x
    const prev = parts[i - 1]
    const type = prev.match(/\s[\w]+=["']$/) ? "ATTRIBUTE" : "TEXT"

    console.log(n, prev, type)
  })
  // ...
  return { m }
}

describe("parse", () => {
  it("...", () => {
    const html = `<section><p class="{{0}}">{{1}}</p>{{2}}<a onclick='{{3}}'>{{4}}and{{5}}</a></section><span>{{6}}</span>`

    const { m } = parse(html)
  })
})
