import { html } from "../src/index.js"

describe("html", () => {
  it("...", () => {
    // prettier-ignore
    const result = html`<div>${"0"}</div><p class="${"foo"} bar ${"baz"}">${"1"}</p>`

    assert.equal(
      result,
      `<div><!-- * -->0</div><!-- ** --><p class="foo bar baz"><!-- * -->1</p>`
    )
  })
})
