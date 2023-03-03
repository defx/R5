import { last, walk } from "./helpers.js"

function next(node, { before, after, value }) {
  const isAttr = before.match(/(\w+-?\w+)=['"]{1}([^'"]*)$/)

  if (isAttr) {
    // ...
  } else {
    // ...
  }

  console.log("next", node, node.nextSibling, { isAttr, before, after, value })
}

const isTemplateResult = (v) => v?.hasOwnProperty("markup")

const isPrimitive = (v) => v === null || typeof v !== "object"

export const update = (templateResult, rootNode) => {
  const { markup, strings, values } = templateResult

  console.log({ markup })

  let i = 0

  walk(rootNode, (node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      const isOpenBrace = node.textContent === "{"

      if (isOpenBrace) {
        const { nextSibling } = node
        const value = values[i++]

        if (isPrimitive(value)) {
          if (nextSibling.nodeType === Node.TEXT_NODE) {
            if (nextSibling.textContent !== value) {
              nextSibling.textContent = value
            }
          }

          return nextSibling
        } else if (Array.isArray(value) && isTemplateResult(value[0])) {
          // this is followed by a repeated block...
          // @todo: grab all the nodes between this node and the next closing brace
        }
      }

      //   const stars = node.textContent.match(/(\*+)/)?.[1].split("")
      //   if (!stars) return
      //   stars.forEach(() => {
      //     // ...
      //     const value = values[i]
      //     const before = strings
      //       .slice(0, i + 1)
      //       .join("")
      //       .trim()
      //     const after = strings
      //       .slice(i + 1)
      //       .join("")
      //       .trim()
      //     next(node, { before, after, value })
      //     i += 1
      //   })
    }
  })
}
