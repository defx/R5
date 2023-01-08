import { walk } from "./helpers.js"
import { hasMustache, getParts } from "./token.js"

function fromTemplate(str) {
  let tpl = document.createElement("template")
  tpl.innerHTML = str.trim()
  return tpl.content.cloneNode(true)
}

export const parse = (blueprint) => {
  const { tpl, values } = blueprint
  const rootNode = fromTemplate(tpl)
  walk(rootNode, (node) => {
    switch (node.nodeType) {
      case node.TEXT_NODE: {
        let value = node.textContent
        if (hasMustache(value)) {
          // this could be a simple text node, but it could also be a placeholder for a dynamic block (if|each)...you'll need to check the values to figure that out. if its another { tpl, values } type object then its a dynamic block.
          //...it can also be mixed, as in some static text with a dynamic block in the middle, for example
          const parts = getParts(value)
        }
        break
      }
      case node.ELEMENT_NODE: {
        let attrs = [...node.attributes]
        let i = attrs.length
        while (i--) {
          let { name, value } = attrs[i]
          if (hasMustache(value)) {
            const parts = getParts(value)
            //...
          }
        }
        break
      }
    }
  })
}

export const xparse = (rootNode, subscribers = []) => {
  walk(rootNode, (node) => {
    switch (node.nodeType) {
      case node.TEXT_NODE: {
        let value = node.textContent
        if (hasMustache(value)) {
          const parts = getParts(value)
          let prevVal
          subscribers.push((values) => {
            const nextVal = parts.reduce((a, { type, value }) => {
              return a + (type === 1 ? value : values[value])
            }, "")

            if (nextVal !== prevVal) {
              node.textContent = nextVal
            }
            prevVal = nextVal
          })
        }
        break
      }
      case node.ELEMENT_NODE: {
        let attrs = [...node.attributes]
        let i = attrs.length
        while (i--) {
          let { name, value } = attrs[i]
          if (hasMustache(value)) {
            const parts = getParts(value)
            let prevVal
            subscribers.push((values) => {
              const nextVal = parts.reduce((a, { type, value }) => {
                return a + (type === 1 ? value : values[value])
              }, "")

              if (nextVal !== prevVal) {
                node.setAttribute(name, nextVal)
              }
              prevVal = nextVal
            })
          }
        }
        break
      }
    }
  })

  return subscribers
}
