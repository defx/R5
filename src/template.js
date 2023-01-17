const blueprints = new WeakSet()

export const html = (strings, ...values) => {
  const l = values.length
  const tpl = strings
    .reduce((a, s, i) => {
      return a + s + (i < l ? `{{ ${i} }}` : ``)
    }, "")
    .trim()

  const x = {
    t: tpl,
    v: values,
  }
  blueprints.add(x)

  return x
}

function isBlueprint(v) {
  return blueprints.has(v)
}

export const ATTRIBUTE = 0
export const TEXT = 1

/*

takes an array of strings (from a template literal) and returns a map from traversal index to binding descriptor:

{
    index: (nodeTraversalIndex)
    type: ATTRIBUTE || TEXT,
    name?: (attribute name)
}

*/
export function parse(strings) {
  let c = 0
  let tagOpen = false
  let map = {}

  strings.forEach((str, i) => {
    //...
    str.split("").forEach((char, j) => {
      //...
      if (char === "<") {
        tagOpen = true
        if (str[j + 1] !== "/") c++
      }

      if (char === ">") {
        tagOpen = false
      }
    })

    if (i < strings.length - 1) {
      // this is followed by a value...

      const type = tagOpen ? ATTRIBUTE : TEXT

      const entry = { type }

      if (type === ATTRIBUTE) {
        // ....
        const start = str.lastIndexOf(" ") + 1
        const end = str.lastIndexOf("=")
        const name = str.slice(start, end)
        entry.name = name
      }

      map[c] = map[c] || []

      map[c].push(entry)
    }
  })

  return map
}
