import { define, html } from "../src/index.js"

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

  it("repeated blocks", async () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          someClass: "xyz",
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

    assert.equal($$(`li`).length, 3)
    assert.deepEqual(
      $$(`li`).map((v) => v.textContent),
      ["kim", "thea", "ericka"]
    )
  })

  it("repeated blocks (multiple top-level nodes)", async () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          items: [
            {
              id: 0,
              term: "Beast of Bodmin",
              description: "A large feline inhabiting Bodmin Moor.",
            },
            { id: 1, term: "Morgawr", description: "A sea serpent." },
            {
              id: 2,
              term: "Owlman",
              description: "A giant owl-like creature.",
            },
          ],
        },
        update: {
          set: (_, { payload }) => {
            return payload
          },
        },
        render: ({ items }) =>
          html`<dl>
            ${items?.map(
              ({ id, term, description }) => html`
                <template @key="${id}">
                  <dt>${term}</dt>
                  <dd>${description}</dd>
                </template>
              `
            )}
          </dl>`,
      }
    })
    mount(`<${name}></${name}>`)

    assert.ok(
      $(name).innerHTML.includes(
        `<dt>Beast of Bodmin</dt><dd>A large feline inhabiting Bodmin Moor.</dd><dt>Morgawr</dt><dd>A sea serpent.</dd><dt>Owlman</dt><dd>A giant owl-like creature.</dd></dl>`
      )
    )

    $(name).$dispatch({
      type: "set",
      payload: {
        items: [
          {
            id: 3,
            term: "The Harpenden Hakutaku",
            description:
              "A talking beast which handed down knowledge on harmful spirits",
          },
          {
            id: 0,
            term: "Beast of Bodmin",
            description: "A large feline inhabiting Bodmin Moor.",
          },
          { id: 2, term: "Owlman", description: "A giant owl-like creature." },
          { id: 1, term: "Morgawr", description: "A sea serpent." },
        ],
      },
    })

    assert.ok(
      $(name).innerHTML.includes(
        `<dt>The Harpenden Hakutaku</dt><dd>A talking beast which handed down knowledge on harmful spirits</dd><dt>Beast of Bodmin</dt><dd>A large feline inhabiting Bodmin Moor.</dd><dt>Owlman</dt><dd>A giant owl-like creature.</dd><dt>Morgawr</dt><dd>A sea serpent.</dd></dl>`
      )
    )
  })

  it("transitions", () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          // items: [
          //   { id: 1, name: "kim", age: 36 },
          //   { id: 2, name: "thea", age: 8 },
          //   { id: 3, name: "ericka", age: 5 },
          // ],
        },
        update: {
          set: (_, { payload }) => {
            return payload
          },
        },
        render: ({ items }) =>
          html`<ul>
            ${items?.map(
              ({ id, name, age }) =>
                html`<li @key="${id}">${name} (${age})</li>`
            )}
          </ul>`,
      }
    })
    mount(`<${name}></${name}>`)

    assert.equal($(name).innerHTML, `<ul></ul>`)

    $(name).$dispatch({
      type: "set",
      payload: {
        items: [
          { id: 1, name: "kim", age: 36 },
          { id: 2, name: "thea", age: 8 },
          { id: 3, name: "ericka", age: 5 },
        ].sort((a, b) => a.age - b.age),
      },
    })

    assert.deepEqual(
      $$(`li`).map((v) => v.textContent),
      ["ericka (5)", "thea (8)", "kim (36)"]
    )

    $(name).$dispatch({
      type: "set",
      payload: {
        items: [
          { id: 0, name: "matt", age: 39 },
          { id: 1, name: "kim", age: 36 },
          { id: 2, name: "thea", age: 8 },
          { id: 3, name: "ericka", age: 5 },
        ].sort((a, b) => b.age - a.age),
      },
    })

    assert.deepEqual(
      $$(`li`).map((v) => v.textContent),
      ["matt (39)", "kim (36)", "thea (8)", "ericka (5)"]
    )
  })
})
