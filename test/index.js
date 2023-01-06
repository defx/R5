import { html } from "../src/index.js"

describe("...", () => {
  it("replaces text interpolations with placeholders", () => {
    const classes = ["my1", "px2"]
    const greeting = "hello world!"

    const tpl = html`<p class="${classes}">${greeting}</p>`

    assert.equal(tpl, `<p class="{{ 0 }}">{{ 1 }}</p>`)

    // this can be parsed as normal by synergy, but now we have a way to generate the template with template literals rather than an esoteric template syntax
  })
  it("replaces arrays with repeated blocks", () => {
    const items = [{ name: "kim" }, { name: "thea" }, { name: "ericka" }]

    const tpl = html`<ul>
      ${items.map(({ name }) => html`<li>${name}</li>`)}
    </ul>`

    console.log(tpl)

    // this can be parsed as normal by synergy, but now we have a way to generate the template with template literals rather than an esoteric template syntax
  })
})
