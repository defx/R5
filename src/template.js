import { last, walk } from "./helpers.js"
import { hasMustache, getParts } from "./token.js"

function reformat(str) {
  return str.replace(/\n|\s{2,}/g, "")
}

const blueprints = new WeakSet()

// @todo: cache strings
export const html = (strings, ...values) => {
  const l = values.length
  const tpl = strings
    .reduce((a, s, i) => {
      return a + s + (i < l ? `{{ ${i} }}` : ``)
    }, "")
    .trim()

  const x = {
    t: reformat(tpl),
    v: values,
  }
  blueprints.add(x)

  return x
}

function isBlueprint(v) {
  return blueprints.has(v)
}

function asTemplate(str) {
  let tpl = document.createElement("template")
  tpl.innerHTML = str.trim()
  if (tpl.content.firstElementChild?.nodeName === "TEMPLATE") {
    return tpl.content.firstElementChild
  }
  return tpl
}

export function fromTemplate(str) {
  return asTemplate(str).content.cloneNode(true)
}

const blockSize = (template) => {
  let i = 0
  walk(template.content?.firstChild || template.firstChild, () => i++, false)
  return i
}

const elementSiblings = (node, n, blockSize) => {
  const siblings = []
  let t = node
  while (n--) {
    let nodes = []
    let x = blockSize
    while (x--) {
      nodes.push(t.nextElementSibling)
      t = last(nodes)
    }
    siblings.push(nodes)
  }
  return siblings
}

function lastChild(v) {
  if (Array.isArray(v)) return last(v)
  return (v.nodeType === v.DOCUMENT_FRAGMENT_NODE && v.lastChild) || v
}

function firstChild(v) {
  if (Array.isArray(v)) return v[0]
  return (v.nodeType === v.DOCUMENT_FRAGMENT_NODE && v.firstChild) || v
}

function appendable(v) {
  if (Array.isArray(v)) {
    const frag = document.createDocumentFragment()
    v.forEach((node) => frag.append(node))
    return frag
  }
  return v
}

function listSync(template, delta, blockSize) {
  let n = +(template.dataset.length || 0)
  const unchanged = delta.length === n && delta.every((a, b) => a == b)

  if (unchanged) return

  const blocks = elementSiblings(template, n, blockSize)
  let t = template

  delta.forEach((i, newIndex) => {
    let el = i === -1 ? template.content.cloneNode(true) : blocks[i]
    let x = lastChild(el)

    if (t.nextElementSibling !== firstChild(el)) {
      t.after(appendable(el))
    }
    t = x
  })

  template.dataset.length = delta.length

  return t
}

const cache = new WeakMap()
const rbCache = new WeakMap()
const placeholderCache = new WeakMap()

function findParts(node) {
  if (!cache.has(node) && hasMustache(node.textContent)) {
    cache.set(node, getParts(node.textContent))
  }
  return cache.get(node)
}

function getTemplateKey(template) {
  const node = template.hasAttribute("@key")
    ? template
    : template.content.firstElementChild

  const k = node.getAttribute?.("@key")
  if (k) {
    const vi = +k.match(/{{([^{}]+)}}/)[1]
    node.removeAttribute("@key")
    return vi
  }
}

function blockTemplate(node, v, i) {
  console.log(node, v, i)

  // convert to template...
  const template = asTemplate(v[i].t || v[i][0].t)
  const key = getTemplateKey(template)
  const index = i
  node.parentNode.replaceChild(template, node)

  rbCache.set(template, {
    index,
    key,
    blockSize: blockSize(template),
  })
  return template
}

export const update = (blueprint, rootNode) => {
  const { t, v } = blueprint

  walk(rootNode, (node) => {
    switch (node.nodeType) {
      case node.TEXT_NODE: {
        const parts = findParts(node)

        console.log(parts)

        /*
        
        
        we need to look at the parts together...

        there are only two types (1 and 2)

        1 = string
        2 = value

        the main complication is when a value is falsy, then we don't yet know what goes in that "slot". for example, it could be a string that just isn't initialised, but it could also be a nested block. 

        when we have a single value that is falsy (or an empty array), then we simply replace the text node with a placeholder template. 
        
        in actual fact, this could also turn out just to be a string once initialised, so we need to be able to handle that scenario.

        when the html function is invoked, and values are replaced with interpolation placeholders with an index to identify which value goes there. (e.g., "{{ 1 }}")


        if a value occurs next to a text string in the template, then it will be a part of the same text node when we first convert it into a DOM tree.

        when we parse such a text node, it is clear that we have multiple parts, however in the case of falsy values, we can't be sure what these values are yet. one thing we can say about this situation is that there is definitely a static string that can be rendered. 

        the first thing we must do is render any static strings or non-falsy values. probably the simplest way to do this is take the parts as far as we can (until there is a falsy value that we don't understand), and then split the parts, render the text node, and use the remaining parts with a new template placeholder and continue walking the DOM from there. we would also need to ensure that any static / non-falsy values following the placeholder also get their own parts/nodes.

        ok this is starting to make a little more sense in my mind now. i think we just need to iterate over the parts and be ready to split before / after a falsy value OR a block. 
        
        
        */

        if (parts?.length === 1 && parts[0].type === 2) {
          const x = v[parts[0].value]
          if (!x || x.length === 0) {
            const template = asTemplate(``)
            const index = parts[0].value
            node.parentNode.replaceChild(template, node)
            placeholderCache.set(template, { index })
            // console.log("creating placeholder template...")
            return template.nextSibling
          }
        }

        if (parts) {
          if (
            parts.some(
              ({ value: i }) => Array.isArray(v[i]) && v[i].some(isBlueprint)
            )
          ) {
            console.log("A", node, parts)
            return blockTemplate(node, v, parts[0].value)
          }

          const nextVal = parts.reduce((a, { type, value }) => {
            return a + (type === 1 ? value : v[value])
          }, "")

          if (node.textContent !== nextVal) {
            node.textContent = nextVal
          }
        }
        break
      }
      case node.ELEMENT_NODE: {
        if (node.nodeName === "TEMPLATE") {
          const pEntry = placeholderCache.get(node)

          if (pEntry) {
            if (!v[pEntry.index]) return node.nextSibling

            // console.log("upgrading placeholder...", v[pEntry.index])
            console.log("B")
            const template = blockTemplate(node, v, pEntry.index)

            placeholderCache.delete(node)
            return template
          }

          const cacheEntry = rbCache.get(node)
          const value = v[cacheEntry.index]

          if (Array.isArray(value)) {
            const { index, key, values: prevVals = [], blockSize } = cacheEntry

            const nextVals = v[index].map(({ v }) => v)

            if (key === undefined) {
              console.warn("ignoring list without keys", node.innerHTML)
              break
            }

            const prevKeys = prevVals.map((v) => v[key])
            const nextKeys = nextVals.map((v) => v[key])

            if (nextKeys.some((v) => v === undefined)) {
              console.warn(
                `You are trying to re-render a list but one or more of your list keys are undefined!`
              )
              return false
            }

            const delta = nextKeys.map((b) =>
              prevKeys.findIndex((a) => a === b)
            )
            listSync(node, delta, blockSize)
            const listItems = elementSiblings(node, delta.length, blockSize)

            listItems.forEach((items, i) =>
              items.forEach((item) => update(v[index][i], item))
            )

            rbCache.set(node, { ...cacheEntry, values: nextVals })

            return last(last(listItems))?.nextSibling
          } else {
            // console.log("render conditional block...", node, value)

            const shouldRender = !!value
            const attached = node.getAttribute("attached") === "true"
            const { blockSize } = cacheEntry

            if (shouldRender !== attached) {
              if (shouldRender) {
                const n = fromTemplate(value.t)
                update(value.v, n)
                node.after(n)
              } else {
                elementSiblings(node, 1, blockSize)[0].forEach((el) =>
                  el.remove()
                )
              }
            }

            node.setAttribute("attached", shouldRender)
          }
        }

        let attrs = [...node.attributes]
        let i = attrs.length
        while (i--) {
          let { name, value } = attrs[i]

          const parts = getParts(value)
          if (parts) {
            const nextVal = parts.reduce((a, { type, value }) => {
              return a + (type === 1 ? value : v[value])
            }, "")
            if (node.getAttribute(name) !== nextVal) {
              node.setAttribute(name, nextVal)
            }
          }
        }
        break
      }
    }
  })
}
