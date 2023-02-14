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
})
