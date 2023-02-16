import { ATTRIBUTE, DYNAMIC, EMPTY, EVENT, STATIC } from "../src/constants.js"
import { hasMustache, getParts } from "../src/token.js"

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
  let counter = 0

  function map(k, v) {
    m[k] = m[k] || []
    m[k].push(v)
  }

  //   function mapText(value) {
  //     const parts = getParts(value)

  //     let k = counter

  //     for (const [i, part] of Object.entries(parts)) {
  //       counter = k + +i

  //       if (part.type === STATIC) {
  //         const text = document.createTextNode(part.value)
  //         frag.appendChild(text)
  //       }
  //       if (part.type === DYNAMIC) {
  //         const placeholder = Placeholder.create(EMPTY)
  //         frag.appendChild(placeholder)

  //         map[k] = map[k] || []
  //         map[k].push({
  //           index: part.index,
  //         })
  //       }
  //     }
  //   }

  const html = chars.reduce((html, c, i) => {
    let prev = chars[i - 1]
    let next = chars[i + 1]

    if (c === `<`) {
      if (next === `/`) {
        t = 0
        e = 1
        if (text) {
          map(counter, {
            type: "TEXT",
            value: text,
          })
        }
        text = ""
      } else {
        if (text) {
          map(counter, {
            type: "TEXT",
            value: text,
          })
        }
        t = 1
        e = 1
        counter++
        text = ""
      }
    } else if (c === `>`) {
      if (t == 1) {
        e = 0
      }
      if (t === 0) {
        e = 0
      }
    } else if (c.match(/['"]/)) {
      if (prev === `=`) {
        attrName = str
          .slice(0, i - 1)
          .split(" ")
          .pop()
        t = 2
      } else if (t === 2) {
        map(counter, {
          type: "ATTRIBUTE",
          name: attrName,
          value: attr,
        })
        attr = ""
        attrName = ""
        t = 1
      }
    } else if (e === 0) {
      if (!text) counter++
      text += c
    } else if (t === 2) {
      attr += c
    }

    return html + c
  })

  // ...
  return { m, t: html }
}

describe("parse", () => {
  it("...", () => {
    const html = `<section><p class="{{0}} foo">{{1}}and{{2}}</p>{{3}}<a onclick='{{4}}'>{{5}}and{{6}}</a></section><span>{{7}}</span>`

    const { m, t } = parse(html)

    console.log(t, JSON.stringify(m, null, 2))
  })
})
