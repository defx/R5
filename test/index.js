import { html, render } from "../src/index.js"

describe("literally", () => {
  let rootNode

  beforeEach(() => {
    rootNode = document.createElement("root-node")
    document.body.appendChild(rootNode)
  })

  afterEach(() => {
    document.body.removeChild(rootNode)
  })

  it("returns the markup", () => {
    assert.equal(html`<p>Hello World!</p>`, `<p>Hello World!</p>`)
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
})
