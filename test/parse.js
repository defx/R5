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
  const chars = str.split("")

  let t

  chars.forEach((c, i) => {
    let prev = chars[i - 1]
    let next = chars[i + 1]

    if (c === `<`) {
      if (next === `/`) {
        console.log("start close tag")
        t = 0
      } else {
        console.log("start open tag")
        t = 1
      }
    }
    if (c === `>`) {
      if (t) {
        console.log("end open tag")
      } else {
        console.log("end close tag")
      }
    }
    if (c.match(/['"]/)) {
      if (prev === `=`) {
        console.log("open attribute")
      } else {
        console.log("close attribute")
      }
    }
  })

  // ...
  return { m }
}

describe("parse", () => {
  it("...", () => {
    const html = `<section><p class="{{0}} foo">{{1}}and{{2}}</p>{{3}}<a onclick='{{4}}'>{{5}}and{{6}}</a></section><span>{{7}}</span>`

    const { m } = parse(html)
  })
})
