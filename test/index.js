import { construct, html } from "../src/index.js"

describe("construct", () => {
  let rootNode

  beforeEach(() => {
    rootNode = document.createElement("root-node")
    document.body.appendChild(rootNode)
  })

  afterEach(() => {
    document.body.removeChild(rootNode)
  })

  it("renders static content", () => {
    construct(
      rootNode,
      () =>
        html`<!-- hello world! -->
          <p>hi</p>`
    )()

    assert.equal(rootNode.innerHTML, "<!-- hello world! --><p>hi</p>")
  })

  it("sets text", () => {
    const render = construct(rootNode, (value) => html`<p>${value}</p>`)

    render(0)
    assert.equal(rootNode.children[0].textContent, "0")
  })

  it("reuses nodes", () => {
    const render = construct(rootNode, (value) => html`<p>${value}</p>`)

    render(0)
    const p = rootNode.children[0]
    render(1)
    assert.equal(rootNode.children[0], p)
  })

  it("sets attributes", () => {
    const render = construct(
      rootNode,
      ({ one, two }) => html`<p class="${one} ${two}"></p>`
    )

    render({ one: "foo", two: "bar" })
    assert(rootNode.children[0].getAttribute("class"), "foo bar")
  })

  it("renders lists", () => {
    const render = construct(
      rootNode,
      (items) => html`<ul>
        ${items.map(({ id, name }) => html`<li>${name}</li>`)}
      </ul>`
    )
    render([
      { id: 1, name: "Kim" },
      { id: 2, name: "Matt" },
    ])

    assert.equal(rootNode.querySelectorAll("li").length, 2)
    assert.equal(rootNode.textContent, "KimMatt")
  })

  it("reorders keyed lists", () => {
    const render = construct(
      rootNode,
      (items) => html`<ul>
        ${items.map(({ id, name }) => html`<li>${name}</li>`.key(id))}
      </ul>`
    )
    render([
      { id: 1, name: "Kim" },
      { id: 2, name: "Matt" },
    ])

    assert.equal(rootNode.querySelectorAll("li").length, 2)
    assert.equal(rootNode.textContent, "KimMatt")

    render([
      { id: 1, name: "Kim" },
      { id: 2, name: "Matt" },
      { id: 3, name: "Thea" },
      { id: 4, name: "Ericka" },
    ])

    const li = [...rootNode.querySelectorAll("li")]

    assert.equal(li.length, 4)
    assert.equal(rootNode.textContent, "KimMattTheaEricka")

    const [kim] = li

    render(
      [
        { id: 1, name: "Kim" },
        { id: 2, name: "Matt" },
        { id: 3, name: "Thea" },
        { id: 4, name: "Ericka" },
      ].reverse()
    )

    const li2 = [...rootNode.querySelectorAll("li")]

    assert.equal(rootNode.textContent, "ErickaTheaMattKim")
    assert.equal(li2[3], kim)
  })
})
