import { first, last, walk, templateNodeFromString } from "./helpers.js"

const isTemplateResult = (v) => v?.hasOwnProperty("markup")

const isPrimitive = (v) => v === null || typeof v !== "object"

const isOpenBrace = (node) =>
  node.nodeType === Node.COMMENT_NODE && node.textContent === "{"

const isCloseBrace = (node) =>
  node.nodeType === Node.COMMENT_NODE && node.textContent === "}"

const getBlocks = (sentinel) => {
  let blocks = []
  walk(
    sentinel.nextSibling,
    (node) => {
      if (node.nodeType === Node.COMMENT_NODE) {
        if (isCloseBrace(node)) return null
        const id = node.textContent.match(/^#(.+)$/)?.[1]
        if (id) {
          blocks.push({ id, nodes: [] })
          return
        }
      }

      last(blocks)?.nodes.push(node)
    },
    false
  )
  return blocks
}

function Block(v) {
  const { childNodes: nodes } = templateNodeFromString(
    `<!--#${v.$key || "*"}-->${v.markup}`
  ).content.cloneNode(true)

  return {
    id: v.$key,
    nodes: [...nodes],
  }
}

export const update = (templateResult, rootNode) => {
  const { markup, strings, values } = templateResult

  console.log({ markup })

  let i = 0

  walk(rootNode, (node) => {
    if (isOpenBrace(node)) {
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
        const blocks = getBlocks(node)
        const prevIds = blocks.map(({ id }) => id)
        const nextIds = value.map(({ $key }) => $key)
        const nextBlocks = nextIds.map((id, i) => {
          if (id !== null) {
            return blocks.find((block) => block.id == id) || Block(value[i])
          } else {
            return blocks[i]
          }
        })
        const lastNode = last(last(nextBlocks).nodes)

        let t = node

        nextBlocks.forEach((block, i) => {
          const firstChild = first(block.nodes)
          if (t.nextSibling !== firstChild) {
            t.after(...block.nodes)
          }
          update(value[i], firstChild)
          t = last(block.nodes)
        })

        return lastNode.nextSibling
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
