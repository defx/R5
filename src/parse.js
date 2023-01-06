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
        let attrs = [...node.attributes] //.sort(compareAttributes)
        let i = attrs.length
        while (i--) {
          let { name, value } = attrs[i]
          if (hasMustache(value)) {
            // @todo handle mutiple expression in single value
            const i = +parseMustache(value)
            let prevVal
            subscribers.push((values) => {
              const nextVal = values[i]
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
