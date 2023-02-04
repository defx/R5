import terser from "@rollup/plugin-terser"

export default [
  {
    input: "src/entry.js",
    output: {
      file: "dist/synergy.js",
      format: "es",
    },
  },
  {
    input: "src/entry.js",
    plugins: [terser()],
    output: {
      file: "dist/synergy.min.js",
      format: "es",
    },
  },
  {
    input: "src/entry.js",
    output: {
      dir: "cjs",
      format: "cjs",
      preserveModules: true,
    },
  },
]
