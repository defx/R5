import { html, render } from "../src/index.js"

describe("r5", () => {
  let rootNode

  beforeEach(() => {
    rootNode = document.createElement("root-node")
    document.body.appendChild(rootNode)
  })

  afterEach(() => {
    // document.body.removeChild(rootNode)
  })

  it("returns the markup", () => {
    assert.equal(html`<p>Hello World!</p>`.markup, `<p>Hello World!</p>`)
  })

  it("renders static content", () => {
    render(
      html`<!-- hello world! -->
        <p>hi</p>`,
      rootNode
    )

    assert.equal(
      rootNode.innerHTML.replace(/\s*\n\s*/g, ""),
      "<!-- hello world! --><p>hi</p>"
    )
  })

  it("sets text", () => {
    render(html`<p>${0}</p>`, rootNode)
    assert.equal(rootNode.children[0].textContent, "0")
  })

  it("reuses nodes", () => {
    render(html`<p>${"bar"} ok ${"foo"}</p>`, rootNode)
    const p = rootNode.children[0]
    render(html`<p>${"foo"} ok ${"bar"}</p>`, rootNode)
    assert.equal(rootNode.children[0], p)
    assert.equal(rootNode.children[0].textContent, "foo ok bar")
  })

  it("sets attributes", () => {
    render(html`<p class="${"foo"} ${"bar"}"></p>`, rootNode)
    assert.equal(rootNode.children[0].getAttribute("class"), "foo bar")
  })

  it("updates attributes", () => {
    render(
      html`<p
        id="a1"
        class="${"foo"} bar ${"baz"}"
        style="backgroundColor: gold;"
      >
        <em class="${"boo"}"></em>
      </p>`,
      rootNode
    )
    assert.equal(rootNode.children[0].getAttribute("class"), "foo bar baz")
    render(
      html`<p
        id="a1"
        class="${"bar"} baz ${"foo"}"
        style="backgroundColor: gold;"
      >
        <em class="${"boo"}"></em><
      </p>`,
      rootNode
    )
    assert.equal(rootNode.children[0].getAttribute("class"), "bar baz foo")
  })

  it("set conditional/boolean attributes", () => {
    render(html`<p ${"hidden"}></p>`, rootNode)
    assert.equal(rootNode.children[0].hasAttribute("hidden"), true)
    render(html`<p ${false}></p>`, rootNode)
    assert.equal(rootNode.children[0].hasAttribute("hidden"), false)
  })

  it("sets truthy/falsy aria-* attributes", () => {
    render(html`<p aria-hidden="${false}"></p>`, rootNode)
    assert.equal(rootNode.children[0].getAttribute("aria-hidden"), "false")
    render(html`<p aria-hidden="${true}"></p>`, rootNode)
    assert.equal(rootNode.children[0].getAttribute("aria-hidden"), "true")
  })

  it("renders lists", () => {
    render(
      html`<ul>
        ${[{ name: "Kim" }, { name: "Matt" }].map(
          ({ name }) => html`<li>${name}</li>`
        )}
      </ul>`,
      rootNode
    )
    assert.equal(rootNode.querySelectorAll("li").length, 2)
    assert.equal(rootNode.textContent.replace(/\s*\n\s*/g, ""), "KimMatt")
  })

  it("reorders keyed lists", () => {
    const tpl = (items) => html`<ul>
      ${items.map(({ id, name }) => html`<li>${name}</li>`.key(id))}
    </ul>`

    render(
      tpl([
        { id: 1, name: "Kim" },
        { id: 2, name: "Matt" },
      ]),
      rootNode
    )

    assert.equal(rootNode.querySelectorAll("li").length, 2)
    assert.equal(rootNode.textContent.replace(/\s*\n\s*/g, ""), "KimMatt")

    render(
      tpl([
        { id: 1, name: "Kim" },
        { id: 2, name: "Matt" },
        { id: 3, name: "Thea" },
        { id: 4, name: "Ericka" },
      ]),
      rootNode
    )

    const li = [...rootNode.querySelectorAll("li")]

    assert.equal(li.length, 4)
    assert.equal(
      rootNode.textContent.replace(/\s*\n\s*/g, ""),
      "KimMattTheaEricka"
    )

    const [kim] = li

    render(
      tpl(
        [
          { id: 1, name: "Kim" },
          { id: 2, name: "Matt" },
          { id: 3, name: "Thea" },
          { id: 4, name: "Ericka" },
        ].reverse()
      ),
      rootNode
    )

    const li2 = [...rootNode.querySelectorAll("li")]

    assert.equal(
      rootNode.textContent.replace(/\s*\n\s*/g, ""),
      "ErickaTheaMattKim"
    )
    assert.equal(li2[3], kim)
  })

  it("binds events", () => {
    let x
    render(html`<a onclick="${() => (x = "foo")}"></a>`, rootNode)
    rootNode.children[0].click()
    assert.equal(x, "foo")
    render(html`<a onclick="${() => (x = "bar")}"></a>`, rootNode)
    rootNode.children[0].click()
    assert.equal(x, "bar")
  })

  it("binds events (nested templates)", () => {
    let calls = []

    render(
      html`
        <ul>
          ${[1, 2, 3].map(
            (n) =>
              html`
                <li
                  onclick="${() => {
                    calls.push(n)
                  }}"
                >
                  ${n}
                </li>
              `
          )}
        </ul>
      `,
      rootNode
    )

    assert.deepEqual(calls, [])
    rootNode.querySelectorAll(`li`).forEach((el) => el.click())
    assert.deepEqual(calls, [1, 2, 3])

    render(
      html`
        <ul>
          ${[1, 2, 3].map(
            (n) =>
              html`
                <li
                  onclick="${() => {
                    calls.push(n)
                  }}"
                >
                  ${n}
                </li>
              `
          )}
        </ul>
      `,
      rootNode
    )

    calls = []

    assert.deepEqual(calls, [])
    rootNode.querySelectorAll(`li`).forEach((el) => el.click())
    assert.deepEqual(calls, [1, 2, 3])
  })

  it("sets textarea", () => {
    render(
      html`hi<textarea maxlength="${2}" autofocus>${"bonjour"}</textarea>`,
      rootNode
    )
    assert.equal(rootNode.children[0].value, "bonjour")

    render(
      html`<textarea maxlength="${2}" autofocus>${"hello"}</textarea>`,
      rootNode
    )
    assert.equal(rootNode.children[0].value, "hello")
  })

  it("renders empty string for undefined values", () => {
    render(
      html`
        <pre>
        ${undefined}
        </pre
        >
      `,
      rootNode
    )

    assert.equal(rootNode.textContent.trim(), "")
  })

  it("renders empty string for null values", () => {
    render(
      html`
        <pre>
        ${null}
        </pre
        >
      `,
      rootNode
    )

    assert.equal(rootNode.textContent.trim(), "")
  })

  it("renders a non-nullish falsy value", () => {
    render(
      html`
        <pre>
        ${0}
        </pre
        >
      `,
      rootNode
    )

    assert.equal(rootNode.textContent.trim(), "0")
  })

  it("renders svg", () => {
    render(
      html`
        <svg
          version="1.1"
          width="300"
          height="200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100%" height="100%" fill="red" />

          ${new Array(12)
            .fill(0)
            .map((_, i) => ({ cx: i * 50, cy: i * 50, r: 25, fill: "green" }))
            .map(({ cx, cy, r, fill }, i) =>
              html`
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" />
              `.key(i)
            )}

          <text
            x="150"
            y="125"
            font-size="60"
            text-anchor="middle"
            fill="white"
          >
            SVG
          </text>
        </svg>
      `,
      rootNode
    )

    assert.equal(rootNode.querySelector("circle").getAttribute("cx"), "0")

    render(
      html`
        <svg
          version="1.1"
          width="300"
          height="200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100%" height="100%" fill="red" />

          ${new Array(12)
            .fill(0)
            .map((_, i) => ({ cx: i * 50, cy: i * 50, r: 25, fill: "blue" }))
            .map(({ cx, cy, r, fill }, i) =>
              html`
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" />
              `.key(i)
            )}

          <text
            x="150"
            y="125"
            font-size="60"
            text-anchor="middle"
            fill="white"
          >
            SVG
          </text>
        </svg>
      `,
      rootNode
    )

    assert.equal(rootNode.querySelector("circle").getAttribute("fill"), "blue")
  })

  it("handles conditional blocks", () => {
    const template = ({ suggestions, searchText }, dispatch) =>
      html`
        <input
          type="text"
          oninput="${(e) =>
            dispatch("searchTextInput", { text: e.target.value })}"
          value="${searchText}"
        />
        <ul>
          ${searchText.length >= 2 &&
          suggestions.map(({ id, text }) =>
            html`<li onclick="${() => dispatch("suggestionClick", { id })}">
              ${text}
            </li> `.key(id)
          )}
        </ul>
      `

    const suggestions = [
      {
        id: 0,
        text: "ac milan",
      },
      { id: 1, text: "inter milan" },
    ]

    render(
      template({
        suggestions,
        searchText: "",
      }),
      rootNode
    )

    render(
      template({
        suggestions,
        searchText: "ac",
      }),
      rootNode
    )

    assert.equal(rootNode.querySelectorAll(`li`).length, 2)

    render(
      template({
        suggestions,
        searchText: "",
      }),
      rootNode
    )

    assert.equal(rootNode.querySelectorAll(`li`).length, 0)
  })

  it("binds non-primitive values as props", () => {
    const items = [
      { title: "feed the dog" },
      { title: "walk the cat" },
      { title: "play for time" },
    ]

    render(
      html`
        <!-- hi -->
        <todo-app items="${items}"></todo-app>
        <!-- bye -->
      `,
      rootNode
    )

    assert.ok(rootNode.querySelector(`todo-app`).items)
    assert.equal(rootNode.querySelector(`todo-app`).items, items)
  })
})
