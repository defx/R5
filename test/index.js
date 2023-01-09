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

    assert.equal($(`p`)?.textContent, "hello!")
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

  it("interpolates text", async () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          message: "hello!",
        },
        render: ({ message }) => html`<p>frankie says ${message}</p>`,
      }
    })
    mount(`<${name}></${name}>`)

    assert.equal($(`p`).textContent, "frankie says hello!")
  })

  it("manages repeated blocks", async () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          someClass: "xyz",
          //   items: [],
          items: [
            { id: 1, name: "kim" },
            { id: 2, name: "thea" },
            { id: 3, name: "ericka" },
          ],
        },
        render: ({ items, someClass }) =>
          html`<ul class="${someClass}">
            ${items?.map(({ id, name }) => html`<li @key="${id}">${name}</li>`)}
          </ul>`,
      }
    })
    mount(`<${name}></${name}>`)

    /*

    1.
    
    <ul>{{ 0 }}</ul>

    2.      

    <li>{{ 0 }}</li>
    
    */
  })
})
