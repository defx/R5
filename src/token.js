import { STATIC, DYNAMIC } from "./constants.js"

export const hasMustache = (v) => v.match(/({{[^{}]+}})/)

export const stripPlaceholders = (v) => v.replace(/({{[^{}]+}})/g, "")

export const getParts = (value) =>
  value
    .trim()
    .split(/({{[^{}]+}})/)
    .filter((v) => v)
    .map((value) => {
      let match = value.match(/{{([^{}]+)}}/)

      if (!match)
        return {
          type: STATIC,
          value,
        }

      return {
        type: DYNAMIC,
        index: +match[1].trim(),
      }
    })
