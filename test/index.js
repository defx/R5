import { construct, html } from "../src/index.js"

function reformat(str) {
  return str.replace(/\n|\s{2,}/gm, "")
}

function stripComments(str) {
  return str.replace(/<!--[\s\S]*?-->/gm, "")
}

describe("construct", () => {
  let rootNode

  beforeEach(() => {
    rootNode = document.createElement("root-node")
    document.body.appendChild(rootNode)
  })

  afterEach(() => {
    document.body.removeChild(rootNode)
  })

  it("...", () => {
    construct(rootNode, () => html`<p>hi</p>`)()
    assert.equal(rootNode.innerHTML, "<p>hi</p>")
  })
})
