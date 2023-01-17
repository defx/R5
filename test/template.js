import { parse, ATTRIBUTE, TEXT } from "../src/template.js"

describe("template.parse", () => {
  it("...", () => {
    const map = parse([`<p class="`, `">`, `</p>`])

    assert.equal(map[1][0].type, ATTRIBUTE)
    assert.equal(map[1][0].name, "class")
    assert.equal(map[1][1].type, TEXT)
    assert.equal(map[1][1].name, undefined)
  })
})
