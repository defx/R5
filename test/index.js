import { define, html } from "../src/index.js"

function reformat(str) {
  return str.replace(/\n|\s{2,}/g, "")
}

describe("define()", () => {
  it("replaces text", async () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          message: "hello!",
        },
        render: ({ message }) => html`<p>${message}</p>`,
      }
    })
    mount(`<${name}></${name}>`)

    assert.equal($(`p`).textContent, "hello!")
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

    assert.equal($(`p`).getAttribute("class"), "mb1")
  })

  it("interpolates attributes", async () => {
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

    assert.equal($(`p`).getAttribute("class"), "mb1 bar")
  })
})
