import { html } from "../src/index.js"

function reformat(str) {
  return str.replace(/\n|\s{2,}/g, "")
}

describe("...", () => {
  it("replaces text interpolations with placeholders", () => {
    const classes = ["my1", "px2"]
    const greeting = "hello world!"

    const tpl = html`<p class="${classes}">${greeting}</p>`

    assert.equal(tpl, `<p class="{{ 0 }}">{{ 1 }}</p>`)
  })
  it("replaces arrays with repeated blocks", () => {
    const items = [{ name: "kim" }, { name: "thea" }, { name: "ericka" }]

    const tpl = html`<ul>
      ${items.map(({ name }) => html`<li>${name}</li>`)}
    </ul>`

    assert.equal(reformat(tpl), `<ul>{{ 0 }}</ul>`)
  })
})
