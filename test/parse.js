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


in terms of the node index...

i think you can just count

    - tag open
    - start text
  
  */

  let t

  let e = 0

  let text = ""
  let attr = ""
  let attrName = ""

  chars.forEach((c, i) => {
    let prev = chars[i - 1]
    let next = chars[i + 1]

    if (c === `<`) {
      if (next === `/`) {
        console.log("start close tag", { text })
        t = 0
        e = 1
        // @todo: emit text
        text = ""
      } else {
        console.log("start open tag", { text })
        t = 1
        e = 1
        // @todo: emit text

        text = ""
      }
    } else if (c === `>`) {
      if (t == 1) {
        console.log("end open tag")
        e = 0
      }
      if (t === 0) {
        console.log("end close tag")
        e = 0
      }
    } else if (c.match(/['"]/)) {
      if (prev === `=`) {
        attrName = str
          .slice(0, i - 1)
          .split(" ")
          .pop()

        console.log("open attribute")
        t = 2
      } else if (t === 2) {
        console.log("close attribute", { name: attrName, value: attr })
        // @todo: emit attribute
        attr = ""
        attrName = ""
        t = 1
      }
    } else if (e === 0) {
      text += c
      console.log("text", c)
    } else if (t === 2) {
      attr += c
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
