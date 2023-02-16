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

  /* 
  

don't over-egg it, all we need is...

1. each attribute: (nodeIndex, name, value)
2. each text node: (nodeIndex, value)
  
  */

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
    } else if (c === `>`) {
      if (t == 1) {
        console.log("end open tag")
      }
      if (t === 0) {
        console.log("end close tag")
      }
    } else if (c.match(/['"]/)) {
      if (prev === `=`) {
        console.log("open attribute")
        t = 2
      } else if (t === 2) {
        console.log("close attribute")
        // @todo: emit attribute
        t = 1
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
