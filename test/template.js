import { html, ATTRIBUTE, TEXT } from "../src/template.js"

xdescribe("template.parse", () => {
  it("...", () => {
    const map = parse([`<p class="`, `">foo `, ` bar</p>`])

    assert.equal(map[1][0].type, ATTRIBUTE)
    assert.equal(map[1][0].name, "class")
    assert.equal(map[1][1].type, TEXT)
    assert.equal(map[1][1].name, undefined)

    console.log(map)
  })
})

describe("template.html", () => {
  it("...", () => {
    const items = [{ x: 10, y: 10, fill: "tomato", width: 25, height: 25 }]

    const map = html`<svg
      version="1.1"
      width="100"
      height="100"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${items?.map(
        ({ x, y, fill, width, height }) => html` <rect
          class="foo"
          x="${x}"
          y="${y}"
          fill="${fill}"
          width="${width}"
          height="${height}"
        ></rect>`
      )}
    </svg>`

    // console.log(map)
  })
})
