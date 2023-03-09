import { first, last, walk, templateNodeFromString } from "./helpers.js"

const isTemplateResult = (v) => v?.hasOwnProperty("markup")

const isPrimitive = (v) => v === null || typeof v !== "object"

const isAttributeSentinel = (node) =>
  node.nodeType === Node.COMMENT_NODE && node.textContent.match(/\*+/)

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
          // return
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
    `<!--#${v.id}-->${v.markup}`
  ).content.cloneNode(true)

  return {
    id: v.id,
    nodes: [...nodes],
  }
}

function attributeValue(name, p, markup) {
  return markup
    .split(/<!--\*+-->/g)
    .filter((v) => v)
    [p]?.match(new RegExp(`${name}=["']([^'"]*)`))?.[1]
}

export const update = (templateResult, rootNode) => {
  const { markup, strings, values, attributes } = templateResult

  // console.log({ markup: markup.replace(/\s+/g, " "), strings })

  let v = 0 // value count
  let p = 0 // placeholder count

  walk(rootNode, (node) => {
    if (isOpenBrace(node)) {
      const { nextSibling } = node

      const value = values[v++]

      if (isPrimitive(value)) {
        if (nextSibling.nodeType === Node.TEXT_NODE) {
          if (nextSibling.textContent !== value) {
            nextSibling.textContent = value
          }
        }

        return
      } else if (Array.isArray(value) && isTemplateResult(value[0])) {
        const blocks = getBlocks(node)
        const nextBlocks = value.map(({ id }, i) => {
          if (id !== undefined) {
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
      p++
    } else if (isAttributeSentinel(node)) {
      const stars = node.textContent.match(/(\*+)/)?.[1].split("")
      const target = node.nextSibling

      console.log({ attributes })

      Array.from(attributes[p]).forEach((name) => {
        const value = attributeValue(name, p, markup)

        if (target.getAttribute(name) !== value) {
          target.setAttribute(name, value)
        }
      })

      v += stars.length
      p++
    }
  })
}
