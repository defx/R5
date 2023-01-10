const VALUE = 1
const KEY = 2

export const hasMustache = (v) => v.match(/({{[^{}]+}})/)

export const getParts = (value) =>
  value
    .trim()
    .split(/({{[^{}]+}})/)
    .filter((v) => v)
    .map((value) => {
      let match = value.match(/{{([^{}]+)}}/)

      if (!match)
        return {
          type: VALUE,
          value,
        }

      return {
        type: KEY,
        value: match[1].trim(),
      }
    })
