import { html } from "../src/index.js"

function reformat(str) {
  return str.replace(/\n|\s{2,}/g, "")
}

describe("...", () => {
  it("replaces text and attribute interpolations with single placeholders", () => {
    const classes = ["my1", "px2"]
    const greeting = "hello world!"

    const tpl = html`<p class="${classes}">${greeting}</p>`

    assert.equal(tpl, `<p class="{{ 0 }}">{{ 1 }}</p>`)
  })
  it("replaces repeated blocks with a single placeholder", () => {
    const items = [{ name: "kim" }, { name: "thea" }, { name: "ericka" }]

    const tpl = html`<ul>
      ${items.map(({ name }) => html`<li>${name}</li>`)}
    </ul>`

    assert.equal(reformat(tpl), `<ul>{{ 0 }}</ul>`)
  })
})
