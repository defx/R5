import { define, html } from "../src/index.js"

function reformat(str) {
  return str.replace(/\n|\s{2,}/gm, "")
}

describe("define()", () => {
  it("replaces text", async () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          // one: "un",
          two: "deux",
          // three: "trois",
          four: "quatre",
          // five: "cinq",
          six: "six",
          // seven: "sept",
          eight: "huit",
        },
        update: {
          set: (_, { payload }) => {
            return payload
          },
        },
        render: ({ one, two, three, four, five, six, seven, eight }) =>
          html`A ${one}, and a&nbsp;
            <p>${two}</p>
            , and a ${three}, and a ${four}, and a
            <p>${five}</p>
            , ${six}, ${seven}, ${eight}!`,
      }
    })
    mount(`<${name}></${name}>`)

    assert.equal(
      $(name).textContent,
      `A , and adeux, and a , and a quatre, and a, six, , huit!`
    )

    $(name).$dispatch({
      type: "set",
      payload: {
        one: "un",
        two: "deux",
        three: "trois",
        four: "quatre",
        five: "cinq",
        six: "six",
        seven: "sept",
        eight: "huit",
      },
    })

    assert.equal(
      $(name).textContent,
      `A un, and adeux, and a trois, and a quatre, and acinq, six, sept, huit!`
    )
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
      reformat($(name).innerHTML).includes(
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
      reformat($(name).innerHTML).includes(
        `<dt>The Harpenden Hakutaku</dt><dd>A talking beast which handed down knowledge on harmful spirits</dd><dt>Beast of Bodmin</dt><dd>A large feline inhabiting Bodmin Moor.</dd><dt>Owlman</dt><dd>A giant owl-like creature.</dd><dt>Morgawr</dt><dd>A sea serpent.</dd></dl>`
      )
    )
  })

  it("transitions", () => {
    const name = createName()
    define(name, () => {
      return {
        state: {},
        update: {
          set: (_, { payload }) => {
            return payload
          },
        },
        render: ({ items }) =>
          html`<ul>
            foo
            ${items?.map(
              ({ id, name, age }) =>
                html`<li @key="${id}">${name} (${age})</li>`
            )}
            bar
          </ul>`,
      }
    })
    mount(`<${name}></${name}>`)

    return

    assert.equal(reformat($(name).innerHTML), `<ul>foobar</ul>`)

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

  it("conditional blocks", () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          showBlock: false,
        },
        update: {
          set: (_, { payload }) => {
            return payload
          },
        },
        render: ({ showBlock }) =>
          html`<p>
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Sit
              debitis ullam, tenetur voluptas quisquam eveniet, illo corrupti
              optio praesentium hic quidem magni quam harum animi, adipisci eos
              ipsa nobis. Expedita?
            </p>
            ${showBlock && html` <h1>hello! 👋</h1> `}
            <p>
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Sit
              debitis ullam, tenetur voluptas quisquam eveniet, illo corrupti
              optio praesentium hic quidem magni quam harum animi, adipisci eos
              ipsa nobis. Expedita?
            </p>`,
      }
    })
    mount(`<${name}></${name}>`)

    // ensure that placeholder isn't upgraded when there's still no value
    $(name).$dispatch({ type: "set", payload: { showBlock: false } })

    $(name).$dispatch({ type: "set", payload: { showBlock: true } })

    assert.equal($("h1").textContent, `hello! 👋`)
  })

  it("primitive arrays", () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          items: [1, 2, 3, 4, 5],
        },
        update: {
          set: (_, { payload }) => {
            return payload
          },
        },
        render: ({ items }) =>
          html`<ul>
            ${items?.map((n) => html`<li>${n}</li>`)}
          </ul>`,
      }
    })
    mount(`<${name}></${name}>`)

    assert.equal($(name).textContent, "12345")

    $(name).$dispatch({
      type: "set",
      payload: {
        items: [1, 3, 5, 2, 4],
      },
    })

    assert.equal($(name).textContent, "13524")
  })

  it("SVG support", () => {
    const name = createName()
    define(name, () => {
      return {
        state: {
          items: [
            { x: 10, y: 10, fill: "#ccc", width: 10, height: 10 },
            { x: 30, y: 30, fill: "#ccc", width: 10, height: 10 },
            { x: 50, y: 50, fill: "#ccc", width: 10, height: 10 },
          ],
        },
        update: {
          set: (_, { payload }) => {
            return payload
          },
        },
        render: ({ items }) =>
          html`<svg
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
          </svg>`,
      }
    })
    mount(`<${name}></${name}>`)

    // assert.equal($(name).textContent, "12345")
  })
})
