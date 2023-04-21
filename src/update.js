import { first, last, walk, templateNodeFromString } from "./helpers.js"

const isPrimitive = (v) => v === null || typeof v !== "object"

const isAttributeSentinel = (node) =>
  node.nodeType === Node.COMMENT_NODE && node.textContent.match(/\*+/)

const isTextAreaSentinel = (node) =>
  node.nodeType === Node.COMMENT_NODE && node.textContent.match("&")

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

function getAttributes(p, markup) {
  return (
    markup
      .match(/<!--\*+-->(<[^>]+>)/g)
      [p]?.split(/--><[\w-]+\s/)[1]
      .match(/[^\t\n\f /><"'=]+=['"][^'"]+['"]|(?<!<)[^\t\n\f /><"'=]+/g) || []
  )
}

function attributeEntries(attributes) {
  return (
    attributes?.map((v) => {
      const [a, b] = v.split("=")
      return [a, b ? b.slice(1, -1) : ""]
    }) || []
  )
}

export const update = (templateResult, rootNode, finalNode) => {
  const { markup, values } = templateResult
  let v = 0 // value count
  let p = 0 // placeholder count

  walk(rootNode, (node) => {
    if (isOpenBrace(node)) {
      const { nextSibling } = node

      const value = values[v++]

      if (isPrimitive(value)) {
        if (nextSibling.textContent !== value) {
          nextSibling.textContent = value
        }

        return
      } else if (Array.isArray(value)) {
        const blocks = getBlocks(node)

        const nextBlocks = value.map(({ id }, i) => {
          if (id !== undefined) {
            return blocks.find((block) => block.id == id) || Block(value[i])
          } else {
            return blocks[i] || Block(value[i])
          }
        })

        const removals = blocks.filter(
          (b, i) =>
            !(b.id !== undefined
              ? nextBlocks.find(({ id }) => id === b.id)
              : nextBlocks[i])
        )

        removals.forEach(({ nodes }) => nodes.forEach((node) => node.remove()))

        if (!nextBlocks.length) {
          return node.nextSibling
        }

        const lastNode = last(last(nextBlocks).nodes)
        let t = node
        nextBlocks.forEach((block, i) => {
          const firstChild = first(block.nodes)
          if (t.nextSibling !== firstChild) {
            t.after(...block.nodes)
          }
          t = last(block.nodes)
          update(value[i], firstChild, t)
        })

        return lastNode.nextSibling
      }
      p++
    } else if (isAttributeSentinel(node)) {
      const stars = node.textContent.match(/(\*+)/)?.[1].split("")
      const target = node.nextSibling
      const newAttributes = attributeEntries(getAttributes(p, markup))

      newAttributes.forEach(([name, value]) => {
        if (name === "value") {
          target.value = value
          return
        }

        if (target.hasAttribute(name)) {
          if (target.getAttribute(name) !== value) {
            target.setAttribute(name, value)
          }
        } else {
          target.setAttribute(name, value)
        }
      })

      for (const attr of target.attributes) {
        if (!newAttributes.find(([name]) => name === attr.name)) {
          target.removeAttribute(attr.name)
        }
      }

      v += stars.length
      p++
    } else if (isTextAreaSentinel(node)) {
      const value = values[v]
      const textarea = node.previousSibling
      if (textarea.value !== value) {
        textarea.value = value
      }
    }

    if (finalNode && node.isEqualNode(finalNode)) {
      return 1
    }
  })
}
