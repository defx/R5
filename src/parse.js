import { walk } from "./helpers.js"
import { hasMustache, parseMustache } from "./token.js"

export const parse = (rootNode, subscribers = []) => {
  walk(rootNode, (node) => {
    switch (node.nodeType) {
      case node.TEXT_NODE: {
        let value = node.textContent
        if (hasMustache(value)) {
          const i = +parseMustache(value)
          let prevVal
          subscribers.push((values) => {
            const nextVal = values[i]
            if (nextVal !== prevVal) {
              node.textContent = nextVal
            }
            prevVal = nextVal
          })
        }
        break
      }
      case node.ELEMENT_NODE: {
        // @todo
        break
      }
    }
  })

  return subscribers
}
