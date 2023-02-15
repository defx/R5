import { html, render } from "../src/index.js"

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
    render(
      html`<!-- hello world! -->
        <p>hi</p>`,
      rootNode
    )

    assert.equal(rootNode.innerHTML, "<!-- hello world! --><p>hi</p>")
  })

  it("sets text", () => {
    render(html`<p>${0}</p>`, rootNode)
    assert.equal(rootNode.children[0].textContent, "0")
  })

  it("reuses nodes", () => {
    render(html`<p>${0}</p>`, rootNode)
    const p = rootNode.children[0]
    render(html`<p>${1}</p>`, rootNode)
    assert.equal(rootNode.children[0], p)
  })

  it("sets attributes", () => {
    render(html`<p class="${"foo"} ${"bar"}"></p>`, rootNode)
    assert(rootNode.children[0].getAttribute("class"), "foo bar")
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
    assert.equal(rootNode.textContent, "KimMatt")
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
    assert.equal(rootNode.textContent, "KimMatt")

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
    assert.equal(rootNode.textContent, "KimMattTheaEricka")

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

    assert.equal(rootNode.textContent, "ErickaTheaMattKim")
    assert.equal(li2[3], kim)
  })

  it("listens to events", () => {
    let x

    render(html`<a onclick="${() => (x = "foo")}"></a>`, rootNode)
    rootNode.children[0].click()
    assert.equal(x, "foo")
    render(html`<a onclick="${() => (x = "bar")}"></a>`, rootNode)
    rootNode.children[0].click()
    assert.equal(x, "bar")
    /* @todo: assert that there is only one listener */
  })
})
