import { define, html } from "../src/index.js"

function reformat(str) {
  return str.replace(/\n|\s{2,}/g, "")
}

describe("define()", () => {
  it("replaces text", async () => {
    define("x-foo", () => {
      return {
        state: {
          message: "hello!",
        },
        render: ({ message }) => html`<p>${message}</p>`,
      }
    })
    mount(`<x-foo></x-foo>`)

    assert.equal($(`x-foo p`).textContent, "hello!")
  })
  it("replaces single attributes", async () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          foo: "mb1",
        },
        render: ({ foo }) => html`<p class="${foo}">hi!</p>`,
      }
    })
    mount(`<${name}></${name}>`)

    assert.equal($(`${name} p`).getAttribute("class"), "mb1")
  })

  it("replaces multiple attributes", async () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          foo: "mb1",
        },
        render: ({ foo }) => html`<p class="${foo} bar">hi!</p>`,
      }
    })
    mount(`<${name}></${name}>`)

    assert.equal($(`${name} p`).getAttribute("class"), "mb1 bar")
  })
})
